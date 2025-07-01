import { Controller, Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { MoviesService } from '../movies/movies.service';

@Controller()
export class MovieSyncConsumer {
  private readonly logger = new Logger(MovieSyncConsumer.name);

  constructor(private readonly moviesService: MoviesService) {}

  @EventPattern('sync_movies')
  async handleSyncMovies(@Payload() data: any, @Ctx() context: RmqContext) {
    this.logger.log('Received sync_movies event from RabbitMQ, starting background sync...');
    await this.moviesService.syncData();
    this.logger.log('Background movie sync completed.');
    // Acknowledge message
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}