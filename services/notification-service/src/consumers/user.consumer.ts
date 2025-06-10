import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

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

      // Here you could add more handling logic like:
      // - Send welcome email
      // - Send SMS notification
      // - Update analytics
      // - etc.
    } catch (error) {
      this.logger.error('Error handling user_registered event:', error);
      throw error;
    }
  }
}