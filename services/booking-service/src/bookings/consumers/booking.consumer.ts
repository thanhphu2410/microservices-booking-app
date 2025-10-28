import { Controller, Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { BookingsService } from '../booking.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { EventValidationPipe } from './validation.pipe';
import { BookedBookingDto, ConfirmBookingDto, ExpiredBookingDto } from '../dto/pay-booking.dto';

@Controller()
export class BookingConsumer {
  private readonly logger = new Logger(BookingConsumer.name);

  constructor(private readonly bookingService: BookingsService) {}

  @EventPattern('create_booking')
  async handleCreateBooking(
    @Payload(new EventValidationPipe(CreateBookingDto)) createBookingDto: CreateBookingDto,
    @Ctx() context: RmqContext
  ) {
    this.logger.log('Received create_booking event from RabbitMQ, starting background sync...');
    await this.bookingService.createBooking(createBookingDto);
    this.logger.log('Booking created.');
  }

  @EventPattern('confirm_booking')
  async handlePaymentSucceeded(@Payload(new EventValidationPipe(ConfirmBookingDto)) data: ConfirmBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received confirm_booking event from RabbitMQ, starting background sync...');
    await this.bookingService.confirmBooking(data);
    this.logger.log('Booking confirmed.');
  }

  @EventPattern('seats_booked')
  async handleSeatsBooked(@Payload(new EventValidationPipe(BookedBookingDto)) data: BookedBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received seats_booked event from RabbitMQ, starting background sync...');
    await this.bookingService.bookedBooking(data);
    this.logger.log('Seats booked.');
  }

  @EventPattern('cancel_booking')
  async handleCancelBooking(@Payload() data: { bookingId: string }, @Ctx() context: RmqContext) {
    this.logger.log(`Received cancel_booking event for booking ${data.bookingId}`);

    try {
      await this.bookingService.cancelBooking(data.bookingId);
      this.logger.log(`Booking ${data.bookingId} canceled successfully`);
    } catch (error) {
      this.logger.error(`Error canceling booking ${data.bookingId}:`, error);
      throw error;
    }
  }
}