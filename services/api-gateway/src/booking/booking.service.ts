import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BookingGrpcService } from './interfaces';

@Injectable()
export class BookingsService implements OnModuleInit {
  private bookingService: BookingGrpcService;

  constructor(@Inject('BOOKING_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.bookingService = this.client.getService<BookingGrpcService>('BookingService');
  }

  async listBookings(user_id: string) {
    return this.bookingService.listBookings({ userId: user_id });
  }

  async getBooking(id: string) {
    return this.bookingService.getBooking({ id });
  }
}