import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRequest, PaymentResponse, PaymentCallbackRequest } from './interfaces';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Process payment request
   * POST /payment/pay
   */
  @Post('pay')
  @HttpCode(HttpStatus.OK)
  async processPayment(@Body() paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return this.paymentService.processPayment(paymentRequest);
  }

  /**
   * Payment webhook callback endpoint
   * POST /payment/callback
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async paymentCallback(@Body() callbackRequest: PaymentCallbackRequest): Promise<{ message: string }> {
    return this.paymentService.handlePaymentCallback(callbackRequest);
  }
}
