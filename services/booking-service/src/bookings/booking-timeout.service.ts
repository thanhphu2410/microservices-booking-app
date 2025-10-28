import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Booking, BookingStatusEnum } from './entities/booking.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BookingTimeoutService {
  private readonly logger = new Logger(BookingTimeoutService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @Inject('SAGA_ORCHESTRATOR') private readonly sagaClient: ClientProxy,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkExpiredBookings() {
    try {
      const now = new Date();

      // Find all PAID bookings that have expired
      const expiredBookings = await this.bookingRepository.find({
        where: {
          status: In([BookingStatusEnum.PAID, BookingStatusEnum.PENDING]),
          confirm_expired_time: LessThan(now),
        },
        relations: ['items'],
      });

      if (expiredBookings.length > 0) {
        this.logger.log(`Found ${expiredBookings.length} expired bookings`);

        for (const booking of expiredBookings) {
          await this.handleExpiredBooking(booking);
        }
      } else {
        this.logger.log(`No expired bookings found`);
      }
    } catch (error) {
      this.logger.error(`Error checking expired bookings: ${error.message}`);
    }
  }

  private async handleExpiredBooking(booking: Booking) {
    try {
      // Update booking status to FAILED
      booking.status = BookingStatusEnum.FAILED;
      await this.bookingRepository.save(booking);

      // Emit booking_failed event to saga orchestrator
      await this.sagaClient.emit('booking_failed', {
        bookingId: booking.id,
        reason: 'Seat confirmation timeout',
        timestamp: new Date().toISOString(),
      }).toPromise();

      this.logger.log(`Emitted booking_failed event to saga orchestrator for booking ${booking.id}`);
    } catch (error) {
      this.logger.error(`Error handling expired booking ${booking.id}: ${error.message}`);
    }
  }
}
