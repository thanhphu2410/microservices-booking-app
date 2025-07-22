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
}