import { Module } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { RoomsModule } from './rooms/rooms.module';
import { ShowtimesModule } from './showtimes/showtimes.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './movies/entities/movie.entity';
import { Room } from './rooms/entities/room.entity';
import { Showtime } from './showtimes/entities/showtime.entity';

@Module({
  imports: [
    MoviesModule,
    RoomsModule,
    ShowtimesModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Movie, Room, Showtime],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
