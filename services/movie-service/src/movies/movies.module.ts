import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { ShowtimesModule } from '../showtimes/showtimes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entities/movie.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MovieSyncConsumer } from '../consumers/movie-sync.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movie]),
    ShowtimesModule,
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
  controllers: [MoviesController, MovieSyncConsumer],
  providers: [MoviesService],
})
export class MoviesModule {}