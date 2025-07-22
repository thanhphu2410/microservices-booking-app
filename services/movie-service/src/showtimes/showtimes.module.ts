import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Room } from '../rooms/entities/room.entity';
import { ShowtimeService } from './showtime.service';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeGenerationService } from './showtime-generation.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime, Movie, Room]),
    ClientsModule.register([
      {
        name: 'MOVIE_SYNC_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'movie_sync_queue',
          queueOptions: {
            durable: true
          }
        },
      },
      {
        name: 'SEAT_EVENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'seat_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ShowtimeController],
  providers: [ShowtimeService, ShowtimeGenerationService],
  exports: [ShowtimeService, ShowtimeGenerationService],
})
export class ShowtimesModule {}