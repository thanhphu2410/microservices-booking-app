import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PaymentRequest, PaymentResponse, PaymentCallbackRequest } from './interfaces';
import { PaymentEvent, PaymentSuccessEvent, PaymentFailedEvent } from './payment-events.interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    @Inject('SAGA_ORCHESTRATOR') private readonly sagaClient: ClientProxy,
  ) {}
  /**
   * Mock payment processing with 80% success rate
   * @param paymentRequest - Payment request containing amount and bookingId
   * @returns Payment response with status and transaction details
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    const { amount, bookingId } = paymentRequest;

    const isSuccess = Math.random() > 0.2;

    if (isSuccess) {
      const transactionId = `TXN${Date.now()}`;
      const paymentResponse = {
        status: 'success' as const,
        bookingId,
        transactionId,
        message: 'Thanh toán thành công (mock)',
      };

      // Send webhook callback for successful payment
      try {
        await this.sendPaymentCallback({
          bookingId,
          transactionId,
          status: 'success',
          amount,
        });
      } catch (error) {
        console.error('Failed to send payment callback:', error);
        // Don't fail the payment if callback fails
      }

      // Send payment success event to saga orchestrator
      try {
        await this.sendPaymentEvent({
          eventType: 'PAYMENT_SUCCESS',
          bookingId,
          transactionId,
          amount,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to send payment success event to saga:', error);
        // Don't fail the payment if event sending fails
      }

      return paymentResponse;
    } else {
      // Send payment failed event to saga orchestrator
      try {
        const failedEvent: PaymentFailedEvent = {
          eventType: 'PAYMENT_FAILED',
          bookingId,
          amount,
          timestamp: new Date().toISOString(),
          reason: 'Payment processing failed (mock)',
        };
        await this.sendPaymentEvent(failedEvent);
      } catch (error) {
        console.error('Failed to send payment failed event to saga:', error);
        // Don't fail the payment if event sending fails
      }

      return {
        status: 'failed',
        bookingId,
        message: 'Thanh toán thất bại (mock)',
      };
    }
  }

  /**
   * Send payment callback webhook
   * @param callbackData - Payment callback data
   * @returns Promise<void>
   */
  private async sendPaymentCallback(callbackData: PaymentCallbackRequest): Promise<void> {
    try {
      // Get the base URL from environment or use localhost for development
      const baseUrl = process.env.API_GATEWAY_URL || 'http://localhost:3000';
      const callbackUrl = `${baseUrl}/payment/callback`;

      console.log('Sending payment callback to:', callbackUrl);
      console.log('Callback data:', callbackData);

      const response = await firstValueFrom(
        this.httpService.post(callbackUrl, callbackData, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        })
      );

      console.log('Payment callback sent successfully:', response.status);
    } catch (error) {
      console.error('Error sending payment callback:', error.message);
      throw error;
    }
  }

  /**
   * Send payment event to saga orchestrator
   * @param event - Payment event data
   * @returns Promise<void>
   */
  private async sendPaymentEvent(event: PaymentEvent): Promise<void> {
    try {
      console.log('Sending payment event to saga orchestrator:', event);

      await firstValueFrom(
        this.sagaClient.emit('payment_event', event)
      );

      console.log('Payment event sent successfully to saga orchestrator');
    } catch (error) {
      console.error('Error sending payment event to saga orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Handle payment callback/webhook
   * @param callbackRequest - Payment callback request
   * @returns Success confirmation
   */
  async handlePaymentCallback(callbackRequest: PaymentCallbackRequest): Promise<{ message: string }> {
    const { bookingId, transactionId, status, amount } = callbackRequest;

    // Log the callback for debugging
    console.log('Payment callback received:', {
      bookingId,
      transactionId,
      status,
      amount,
      timestamp: new Date().toISOString(),
    });

    // Send event to saga orchestrator based on callback status
    try {
      const event: PaymentEvent = {
        eventType: status === 'success' ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
        bookingId,
        transactionId: status === 'success' ? transactionId : undefined,
        amount,
        timestamp: new Date().toISOString(),
      };

      await this.sendPaymentEvent(event);
    } catch (error) {
      console.error('Failed to send payment callback event to saga:', error);
      // Don't fail the callback processing if event sending fails
    }

    // Here you would typically:
    // 1. Update the order status in your database
    // 2. Send notifications to users
    // 3. Trigger other business logic based on payment status

    return {
      message: `Payment callback processed for order ${bookingId}`,
    };
  }
}
