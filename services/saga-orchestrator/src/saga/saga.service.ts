import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentEvent, PaymentSuccessEvent, PaymentFailedEvent } from './payment-events.interface';

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);

  constructor(private configService: ConfigService) {
  }

  /**
   * Handle payment success event
   * @param event - Payment success event
   */
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    this.logger.log(`Processing payment success for booking ${event.bookingId}`);

    try {
      // Here you would implement the saga logic for successful payment:
      // 1. Confirm the booking
      // 2. Update seat status to confirmed
      // 3. Send confirmation notification to user
      // 4. Update booking status in database

      this.logger.log(`Payment success processed for booking ${event.bookingId}, transaction ${event.transactionId}`);

      // Example saga steps (you would implement actual service calls here):
      // await this.confirmBooking(event.bookingId);
      // await this.updateSeatStatus(event.bookingId, 'CONFIRMED');
      // await this.sendConfirmationNotification(event.bookingId);

    } catch (error) {
      this.logger.error(`Failed to process payment success for booking ${event.bookingId}:`, error);
      // Implement compensation logic here if needed
      throw error;
    }
  }

  /**
   * Handle payment failed event
   * @param event - Payment failed event
   */
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    this.logger.log(`Processing payment failure for booking ${event.bookingId}`);

    try {
      // Here you would implement the saga logic for failed payment:
      // 1. Cancel the booking
      // 2. Release the reserved seats
      // 3. Send failure notification to user
      // 4. Update booking status in database

      this.logger.log(`Payment failure processed for booking ${event.bookingId}, reason: ${event.reason}`);

      // Example saga steps (you would implement actual service calls here):
      // await this.cancelBooking(event.bookingId);
      // await this.releaseSeats(event.bookingId);
      // await this.sendFailureNotification(event.bookingId);

    } catch (error) {
      this.logger.error(`Failed to process payment failure for booking ${event.bookingId}:`, error);
      // Implement compensation logic here if needed
      throw error;
    }
  }

  /**
   * Handle general payment event
   * @param event - Payment event
   */
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    this.logger.log(`Received payment event: ${event.eventType} for booking ${event.bookingId}`);

    switch (event.eventType) {
      case 'PAYMENT_SUCCESS':
        await this.handlePaymentSuccess(event as PaymentSuccessEvent);
        break;
      case 'PAYMENT_FAILED':
        await this.handlePaymentFailed(event as PaymentFailedEvent);
        break;
      default:
        this.logger.warn(`Unknown payment event type: ${event.eventType}`);
    }
  }
}