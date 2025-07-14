import { Controller, UseGuards, Body, Get, Param, Post, Query } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('seats')
@UseGuards(JwtAuthGuard)
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get('layout')
  async getSeatLayout(@Query('roomId') roomId: string) {
    return this.seatsService.getSeatLayout({ roomId });
  }

  @Get('status')
  async getSeatStatus(@Query('showtimeId') showtimeId: string) {
    return this.seatsService.getSeatStatus({ showtimeId });
  }

  @Post('hold')
  async holdSeats(@Body() body: { showtimeId: string; seatIds: string[]; userId: string; holdDurationMinutes?: number }) {
    return this.seatsService.holdSeats(body);
  }

  @Post('book')
  async bookSeats(@Body() body: { showtimeId: string; seatIds: string[]; userId: string; bookingId: string }) {
    return this.seatsService.bookSeats(body);
  }

  @Post('release')
  async releaseSeats(@Body() body: { showtimeId: string; seatIds: string[]; userId: string }) {
    return this.seatsService.releaseSeats(body);
  }
}