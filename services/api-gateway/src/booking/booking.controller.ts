import { Controller, UseGuards, Body, Get, Param, Post, Query, Request } from '@nestjs/common';
import { BookingsService } from './booking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async listBookings(@Request() req) {
    const user_id = req.user.id;
    return this.bookingsService.listBookings(user_id);
  }

  @Get(':id')
  async getBooking(@Param('id') id: string) {
    return this.bookingsService.getBooking(id);
  }
}