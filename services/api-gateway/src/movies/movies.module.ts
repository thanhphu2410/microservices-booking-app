import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MOVIE_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.MOVIE_SERVICE_URL,
          package: 'movie',
          protoPath: join(__dirname, '../../src/proto/movie.proto'),
        },
      },
    ]),
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}