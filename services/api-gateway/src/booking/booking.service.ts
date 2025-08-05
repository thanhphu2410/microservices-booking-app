import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { BookingGrpcService, ListBookingsRequest, GetBookingRequest, CreateBookingRequest, PayBookingRequest, CancelBookingRequest, Booking, ListBookingsResponse, GetBookingResponse, CreateBookingResponse, PayBookingResponse, CancelBookingResponse } from './interfaces';

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

  async createBooking(user_id: string, showtime_id: string, seats: { id: string; priceRatio: number }[]) {
    return this.bookingService.createBooking({ userId: user_id, showtimeId: showtime_id, seats });
  }

  async payBooking(id: string) {
    return this.bookingService.payBooking({ id });
  }

  async cancelBooking(id: string) {
    return this.bookingService.cancelBooking({ id });
  }
}