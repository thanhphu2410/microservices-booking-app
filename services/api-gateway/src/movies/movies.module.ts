import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { AuthModule } from '../auth/auth.module';
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
      {
        name: 'ROOM_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.MOVIE_SERVICE_URL,
          package: 'room',
          protoPath: join(__dirname, '../../src/proto/room.proto'),
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}