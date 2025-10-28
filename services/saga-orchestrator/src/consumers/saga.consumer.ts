import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SagaService } from '../saga/saga.service';
import { PaymentEvent } from '../saga/interfaces/payment-events.interface';
import { BookingConfirmedEvent, BookingFailedEvent, BookingBookedEvent, BookingCreatedEvent } from '../saga/interfaces/booking-events.interface';
import { SeatsHeldEvent, SeatConfirmedEvent } from '../saga/interfaces/seat-events.interface';

@Controller()
export class SagaConsumer {
  private readonly logger = new Logger(SagaConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly sagaService: SagaService,
  ) {}

  /**
   * Handle payment events from the payment service
   * @param data - Payment event data
   */
  @EventPattern('payment_event')
  async handlePaymentEvent(@Payload() data: PaymentEvent) {
    this.logger.log(`Received payment event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handlePaymentEvent(data);
      this.logger.log(`Successfully processed payment event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process payment event for booking ${data.bookingId}:`, error);
    }
  }

  /**
   * Handle booking created events from the booking service
   * @param data - Booking created event data
   */
  @EventPattern('saga_booking_created')
  async handleBookingCreated(@Payload() data: BookingCreatedEvent) {
    this.logger.log(`Received saga_booking_created event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleBookingCreated(data);
      this.logger.log(`Successfully processed booking created event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process booking created event for booking ${data.bookingId}:`, error);
    }
  }

  /**
   * Handle booking confirmed events from the booking service
   * @param data - Booking confirmed event data
   */
  @EventPattern('saga_booking_confirmed')
  async handleBookingConfirmed(@Payload() data: BookingConfirmedEvent) {
    this.logger.log(`Received saga_booking_confirmed event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleBookingConfirmed(data);
      this.logger.log(`Successfully processed booking confirmed event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process booking confirmed event for booking ${data.bookingId}:`, error);
    }
  }

  @EventPattern('saga_seats_held')
  async handleSeatsHeld(@Payload() data: SeatsHeldEvent) {
    this.logger.log(`Received saga_seats_held event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleSeatsHeld(data);
      this.logger.log(`Successfully processed seats held event for showtime ${data.showtimeId}`);
    } catch (error) {
      this.logger.error(`Failed to process seats held event for showtime ${data.showtimeId}:`, error);
    }
  }

  /**
   * Handle seat confirmed events from the seat service
   * @param data - Seat confirmed event data
   */
  @EventPattern('saga_seat_confirmed')
  async handleSeatConfirmed(@Payload() data: SeatConfirmedEvent) {
    this.logger.log(`Received saga_seat_confirmed event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleSeatConfirmed(data);
      this.logger.log(`Successfully processed seat confirmed event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process seat confirmed event for booking ${data.bookingId}:`, error);
    }
  }

  /**
   * Handle booking failed events from the booking service
   * @param data - Booking failed event data
   */
  @EventPattern('booking_failed')
  async handleBookingFailed(@Payload() data: BookingFailedEvent) {
    this.logger.log(`Received booking failed event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleBookingFailed(data);
      this.logger.log(`Successfully processed booking failed event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process booking failed event for booking ${data.bookingId}:`, error);
    }
  }

  @EventPattern('saga_booking_booked')
  async handleBookingBooked(@Payload() data: BookingBookedEvent) {
    this.logger.log(`Received saga_booking_booked event: ${JSON.stringify(data)}`);

    try {
      await this.sagaService.handleBookingBooked(data);
      this.logger.log(`Successfully processed booking booked event for booking ${data.bookingId}`);
    } catch (error) {
      this.logger.error(`Failed to process booking booked event for booking ${data.bookingId}:`, error);
    }
  }
}