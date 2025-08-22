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

  @EventPattern('payment_succeeded')
  async handlePaymentSucceeded(@Payload(new EventValidationPipe(ConfirmBookingDto)) data: ConfirmBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received payment_succeeded event from RabbitMQ, starting background sync...');
    await this.bookingService.confirmBooking(data);
    this.logger.log('Booking confirmed.');
  }

  @EventPattern('seats_held')
  async handleSeatsHeld(
    @Payload(new EventValidationPipe(CreateBookingDto)) createBookingDto: CreateBookingDto,
    @Ctx() context: RmqContext
  ) {
    this.logger.log('Received seats_held event from RabbitMQ, starting background sync...');

    await this.bookingService.createBooking(createBookingDto);
    this.logger.log('Seats held.');
  }

  @EventPattern('seats_expired')
  async handleSeatsExpired(@Payload(new EventValidationPipe(ExpiredBookingDto)) data: ExpiredBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received seats_expired event from RabbitMQ, starting background sync...');
    await this.bookingService.failedBooking(data);
    this.logger.log('Seats expired.');
  }

  @EventPattern('seats_booked')
  async handleSeatsBooked(@Payload(new EventValidationPipe(BookedBookingDto)) data: BookedBookingDto, @Ctx() context: RmqContext) {
    this.logger.log('Received seats_booked event from RabbitMQ, starting background sync...');
    await this.bookingService.bookedBooking(data);
    this.logger.log('Seats booked.');
  }
}