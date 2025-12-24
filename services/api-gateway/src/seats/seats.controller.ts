import { Controller, UseGuards, Body, Get, Param, Post, Query, Request, UseInterceptors } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';

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
  @UseInterceptors(IdempotencyInterceptor)
  async holdSeats(@Request() req, @Body() body: { showtimeId: string; seatIds: string[]; holdDurationMinutes?: number }) {
    const userId = req.user.id;
    return this.seatsService.holdSeats({ ...body, userId });
  }

  @Post('book')
  @UseInterceptors(IdempotencyInterceptor)
  async bookSeats(@Request() req, @Body() body: { showtimeId: string; seatIds: string[]; bookingId: string }) {
    const userId = req.user.id;
    return this.seatsService.bookSeats({ ...body, userId });
  }

  @Post('release')
  @UseInterceptors(IdempotencyInterceptor)
  async releaseSeats(@Request() req, @Body() body: { showtimeId: string; seatIds: string[] }) {
    const userId = req.user.id;
    return this.seatsService.releaseSeats({ ...body, userId });
  }

  @Post('seed')
  async seedSeats() {
    return this.seatsService.seedSeats();
  }
}