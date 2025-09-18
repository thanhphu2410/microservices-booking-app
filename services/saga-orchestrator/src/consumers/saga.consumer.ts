import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SagaService } from '../saga/saga.service';
import { PaymentEvent } from '../saga/payment-events.interface';

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
      // In a real implementation, you might want to:
      // 1. Send the event to a dead letter queue
      // 2. Implement retry logic
      // 3. Send alerts to monitoring systems
    }
  }
}