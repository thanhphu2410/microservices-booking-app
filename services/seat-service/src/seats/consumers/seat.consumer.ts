import { RedisService } from '@liaoliaots/nestjs-redis';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Redis } from 'ioredis';
import { SeatsService } from '../seats.service';
import { BookSeatsDto } from '../dto/book-seats.dto';
import { EventValidationPipe } from './validation.pipe';
import { ReleaseSeatsDto } from '../dto/release-seats.dto';
import { IdempotencyService } from '../idempotency/idempotency.service';

@Controller()
export class SeatConsumer {
  private readonly logger = new Logger(SeatConsumer.name);

  private readonly redisClient: Redis;

  constructor(
    private readonly redisService: RedisService,
    private readonly seatsService: SeatsService,
    private readonly idempotencyService: IdempotencyService,
  ) {
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

    const key = bookSeatsDto.sagaId || `confirm:${bookSeatsDto.bookingId}`;
    const scope = 'SAGA:BookingConfirmed';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate booking_confirmed for key: ${key}`);
      return;
    }

    try {
      const result = await this.seatsService.bookSeats(bookSeatsDto);
      await this.idempotencyService.succeed(scope, key, result);
      if (result.success) {
        this.logger.log('Seats booked successfully', result);
      } else {
        this.logger.error('Failed to book seats', result);
      }
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      throw error;
    }
  }

  @EventPattern('booking_canceled')
  async handleBookingCanceled(@Payload(new EventValidationPipe(ReleaseSeatsDto)) data: ReleaseSeatsDto, @Ctx() context: RmqContext) {
    this.logger.log('Received event from booking service...', data);

    const key = `cancel:${data.showtimeId}:${JSON.stringify(data.seatIds)}:${data.userId}`;
    const scope = 'SAGA:BookingCanceled';

    const { status } = await this.idempotencyService.begin(scope, key);
    if (status === 'succeeded' || status === 'failed') {
      this.logger.log(`Skipping duplicate booking_canceled for key: ${key}`);
      return;
    }

    try {
      const result = await this.seatsService.releaseSeats(data);
      await this.idempotencyService.succeed(scope, key, result);
      if (result.success) {
        this.logger.log('Seats released successfully', result);
      } else {
        this.logger.error('Failed to release seats', result);
      }
    } catch (error) {
      await this.idempotencyService.fail(scope, key, { message: error?.message });
      throw error;
    }
  }
}