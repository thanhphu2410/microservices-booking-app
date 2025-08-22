import { RedisService } from '@liaoliaots/nestjs-redis';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Redis } from 'ioredis';
import { SeatsService } from '../seats.service';
import { BookSeatsDto } from '../dto/book-seats.dto';
import { EventValidationPipe } from './validation.pipe';
import { ReleaseSeatsDto } from '../dto/release-seats.dto';

@Controller()
export class SeatConsumer {
  private readonly logger = new Logger(SeatConsumer.name);

  private readonly redisClient: Redis;

  constructor(private readonly redisService: RedisService, private readonly seatsService: SeatsService) {
    this.redisClient = this.redisService.getOrThrow();
  }


  @EventPattern('showtime_created')
  async handleShowtimeCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received event from showtime service...', data);
    await this.redisClient.hset(`showtime:${data.showtime.id}`,
      'room_id', data.showtime.roomId,
      'movie_id', data.showtime.movieId
    );
  }

  @EventPattern('seats_seed')
  async handleSeatsSeed(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received event from seats service...', data);
    await this.seatsService.seed(data.roomId);
  }

  @EventPattern('booking_confirmed')
  async handleBookingConfirmed(
    @Payload(new EventValidationPipe(BookSeatsDto)) bookSeatsDto: BookSeatsDto,
    @Ctx() context: RmqContext
  ) {
    this.logger.log('Received event from booking service...', bookSeatsDto);
    const result = await this.seatsService.bookSeats(bookSeatsDto);
    if (result.success) {
      this.logger.log('Seats booked successfully', result);
    } else {
      this.logger.error('Failed to book seats', result);
    }
  }

  @EventPattern('booking_canceled')
  async handleBookingCanceled(@Payload(new EventValidationPipe(ReleaseSeatsDto)) data: ReleaseSeatsDto, @Ctx() context: RmqContext) {
    this.logger.log('Received event from booking service...', data);
    const result = await this.seatsService.releaseSeats(data);
    if (result.success) {
      this.logger.log('Seats released successfully', result);
    } else {
      this.logger.error('Failed to release seats', result);
    }
  }
}