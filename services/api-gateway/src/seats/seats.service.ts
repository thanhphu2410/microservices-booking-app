import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { SeatGrpcService } from './interfaces';
import { RetryUtil } from '../common/utils/retry.util';

@Injectable()
export class SeatsService implements OnModuleInit {
  private readonly logger = new Logger(SeatsService.name);
  private seatService: SeatGrpcService;

  constructor(@Inject('SEAT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.seatService = this.client.getService<SeatGrpcService>('SeatService');
  }

  async getSeatLayout(data: { roomId: string }) {
    return RetryUtil.retryWithBackoff(
      () => this.seatService.getSeatLayout(data),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async getSeatStatus(data: { showtimeId: string }) {
    return RetryUtil.retryWithBackoff(
      () => this.seatService.getSeatStatus(data),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async holdSeats(data: { showtimeId: string; seatIds: string[]; userId: string; holdDurationMinutes?: number }) {
    // Critical operation - use more retries
    return RetryUtil.retryWithBackoff(
      () => this.seatService.holdSeats(data),
      {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async bookSeats(data: { showtimeId: string; seatIds: string[]; userId: string; bookingId: string }) {
    // Critical operation - use more retries
    return RetryUtil.retryWithBackoff(
      () => this.seatService.bookSeats(data),
      {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async releaseSeats(data: { showtimeId: string; seatIds: string[]; userId: string }) {
    return RetryUtil.retryWithBackoff(
      () => this.seatService.releaseSeats(data),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async seedSeats() {
    return RetryUtil.retryWithBackoff(
      () => this.seatService.seedSeats({}),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }
}