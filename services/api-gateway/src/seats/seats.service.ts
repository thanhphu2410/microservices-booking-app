import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { SeatGrpcService } from './interfaces';

@Injectable()
export class SeatsService implements OnModuleInit {
  private seatService: SeatGrpcService;

  constructor(@Inject('SEAT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.seatService = this.client.getService<SeatGrpcService>('SeatService');
  }

  async getSeatLayout(data: { roomId: string }) {
    return this.seatService.getSeatLayout(data);
  }

  async getSeatStatus(data: { showtimeId: string }) {
    return this.seatService.getSeatStatus(data);
  }

  async holdSeats(data: { showtimeId: string; seatIds: string[]; userId: string; holdDurationMinutes?: number }) {
    return this.seatService.holdSeats(data);
  }

  async bookSeats(data: { showtimeId: string; seatIds: string[]; userId: string; bookingId: string }) {
    return this.seatService.bookSeats(data);
  }

  async releaseSeats(data: { showtimeId: string; seatIds: string[]; userId: string }) {
    return this.seatService.releaseSeats(data);
  }

  async syncData() {
    
  }
}