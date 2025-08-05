import { RedisService } from '@liaoliaots/nestjs-redis';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Redis } from 'ioredis';
import { SeatsService } from '../seats.service';

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
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  @EventPattern('seats_seed')
  async handleSeatsSeed(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received event from seats service...', data);
    await this.seatsService.seed(data.roomId);
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  @EventPattern('booking_paid')
  async handleBookingPaid(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received event from booking service...', data);
    const result = await this.seatsService.bookSeats(data);
    if (result.success) {
      this.logger.log('Seats booked successfully', result);
    } else {
      this.logger.error('Failed to book seats', result);
    }
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }

  @EventPattern('booking_canceled')
  async handleBookingCanceled(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received event from booking service...', data);
    const result = await this.seatsService.releaseSeats(data);
    if (result.success) {
      this.logger.log('Seats released successfully', result);
    } else {
      this.logger.error('Failed to release seats', result);
    }
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}