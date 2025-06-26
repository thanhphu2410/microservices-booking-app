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
}