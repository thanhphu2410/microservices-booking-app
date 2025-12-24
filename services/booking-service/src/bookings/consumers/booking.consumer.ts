import { Controller, Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { BookingsService } from '../booking.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { EventValidationPipe } from './validation.pipe';
import { BookedBookingDto, ConfirmBookingDto, ExpiredBookingDto } from '../dto/pay-booking.dto';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Controller()
export class BookingConsumer {
  private readonly logger = new Logger(BookingConsumer.name);

  constructor(
    private readonly bookingService: BookingsService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  @EventPattern('create_booking')
  async handleCreateBooking(
    @Payload(new EventValidationPipe(CreateBookingDto)) createBookingDto: CreateBookingDto,
    @Ctx() context: RmqContext
  ) {
    this.logger.log('Received create_booking event from RabbitMQ, starting background sync...');

    // Use sagaId if available, otherwise generate key from booking data
    const key = createBookingDto.sagaId || `create:${createBookingDto.userId}:${createBookingDto.showtimeId}:${JSON.stringify(createBookingDto.seats.map(seat => seat.id))}`;
    const scope = 'SAGA:CreateBooking';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate create_booking for key: ${key}`);
      return;
    }

    try {
      await this.bookingService.createBooking(createBookingDto);
      await this.idempotencyService.succeed(scope, key, { ok: true });
      this.logger.log('Booking created.');
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      throw error;
    }
  }

  @EventPattern('confirm_booking')
  async handlePaymentSucceeded(@Payload(new EventValidationPipe(ConfirmBookingDto)) data: ConfirmBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received confirm_booking event from RabbitMQ, starting background sync...');

    const key = data.sagaId || `confirm:${data.bookingId}`;
    const scope = 'SAGA:ConfirmBooking';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate confirm_booking for key: ${key}`);
      return;
    }

    try {
      await this.bookingService.confirmBooking(data);
      await this.idempotencyService.succeed(scope, key, { ok: true });
      this.logger.log('Booking confirmed.');
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      throw error;
    }
  }

  @EventPattern('seats_booked')
  async handleSeatsBooked(@Payload(new EventValidationPipe(BookedBookingDto)) data: BookedBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received seats_booked event from RabbitMQ, starting background sync...');

    const key = data.sagaId || `booked:${data.bookingId}`;
    const scope = 'SAGA:SeatsBooked';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate seats_booked for key: ${key}`);
      return;
    }

    try {
      await this.bookingService.bookedBooking(data);
      await this.idempotencyService.succeed(scope, key, { ok: true });
      this.logger.log('Seats booked.');
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      throw error;
    }
  }

  @EventPattern('cancel_booking')
  async handleCancelBooking(@Payload() data: { bookingId: string; sagaId?: string }, @Ctx() context: RmqContext) {
    this.logger.log(`Received cancel_booking event for booking ${data.bookingId}`);

    const key = data.sagaId || `cancel:${data.bookingId}`;
    const scope = 'SAGA:CancelBooking';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate cancel_booking for key: ${key}`);
      return;
    }

    try {
      await this.bookingService.cancelBooking(data.bookingId);
      await this.idempotencyService.succeed(scope, key, { ok: true });
      this.logger.log(`Booking ${data.bookingId} canceled successfully`);
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      this.logger.error(`Error canceling booking ${data.bookingId}:`, error);
      throw error;
    }
  }
}