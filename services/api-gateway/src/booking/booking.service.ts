import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BookingGrpcService } from './interfaces';
import { RetryUtil } from '../common/utils/retry.util';

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);
  private bookingService: BookingGrpcService;

  constructor(@Inject('BOOKING_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.bookingService = this.client.getService<BookingGrpcService>('BookingService');
  }

  async listBookings(user_id: string) {
    return RetryUtil.retryWithBackoff(
      () => this.bookingService.listBookings({ userId: user_id }),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async getBooking(id: string) {
    return RetryUtil.retryWithBackoff(
      () => this.bookingService.getBooking({ id }),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }
}