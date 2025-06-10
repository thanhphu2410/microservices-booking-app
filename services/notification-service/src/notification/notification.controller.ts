import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

interface SendEmailRequest {
  to: string;
  subject: string;
  content: string;
}

interface SendBookingConfirmationRequest {
  email: string;
  bookingDetails: {
    id: string;
    event: string;
    date: string;
    seats: string;
  };
}

interface SendEmailResponse {
  success: boolean;
  messageId: string;
  error?: string;
}

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @GrpcMethod('NotificationService', 'SendEmail')
  async sendEmail(data: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const result = await this.notificationService.sendEmail(
        data.to,
        data.subject,
        data.content,
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        messageId: '',
        error: error.message,
      };
    }
  }

  @GrpcMethod('NotificationService', 'SendBookingConfirmation')
  async sendBookingConfirmation(
    data: SendBookingConfirmationRequest,
  ): Promise<SendEmailResponse> {
    try {
      const result = await this.notificationService.sendBookingConfirmation(
        data.email,
        data.bookingDetails,
      );
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        messageId: '',
        error: error.message,
      };
    }
  }
}