import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../notification/email.service';

interface UserRegisteredMessage {
  userId: string;
  email: string;
  fullName: string;
  event: string;
  timestamp: string;
}

interface BookingCompleteMessage {
  eventType: 'BOOKING_COMPLETE';
  bookingId: string;
  sagaId: string;
  userId: string;
  seatIds: string[];
  showtimeId: string;
  timestamp: string;
}

@Controller()
export class UserConsumer {
  private readonly logger = new Logger(UserConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  @EventPattern('user_registered')
  async handleUserRegistered(@Payload() data: UserRegisteredMessage) {
    try {
      this.logger.log('Received user_registered event');
      this.logger.log('User details:', {
        userId: data.userId,
        email: data.email,
        fullName: data.fullName,
        registeredAt: data.timestamp
      });

      // Send welcome email
      await this.emailService.sendWelcomeEmail(data.email, data.fullName);
      this.logger.log(`Welcome email sent successfully to ${data.email}`);

      // Here you could add more handling logic like:
      // - Send SMS notification
      // - Update analytics
      // - etc.
    } catch (error) {
      this.logger.error('Error handling user_registered event:', error);
      throw error;
    }
  }

  @EventPattern('booking_complete')
  async handleBookingComplete(@Payload() data: BookingCompleteMessage) {
    try {
      this.logger.log('Received booking_complete event');
      this.logger.log('Booking details:', {
        bookingId: data.bookingId,
        sagaId: data.sagaId,
        userId: data.userId,
        seatIds: data.seatIds,
        showtimeId: data.showtimeId,
        completedAt: data.timestamp
      });

      // TODO: Get user email from user service
      // For now, we'll use a placeholder email
      const userEmail = `user-${data.userId}@example.com`;

      // Send booking confirmation email
      await this.emailService.sendBookingConfirmationEmail(
        userEmail,
        {
          bookingId: data.bookingId,
          seatIds: data.seatIds,
          showtimeId: data.showtimeId,
          userId: data.userId
        }
      );

      this.logger.log(`Booking confirmation email sent successfully for booking ${data.bookingId}`);

      // Here you could add more handling logic like:
      // - Send SMS notification
      // - Update analytics
      // - Send push notification
      // - etc.
    } catch (error) {
      this.logger.error('Error handling booking_complete event:', error);
      throw error;
    }
  }
}