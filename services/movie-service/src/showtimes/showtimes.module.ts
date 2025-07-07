import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Room } from '../rooms/entities/room.entity';
import { ShowtimeService } from './showtime.service';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeGenerationService } from './showtime-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime, Movie, Room]),
  ],
  controllers: [ShowtimeController],
  providers: [ShowtimeService, ShowtimeGenerationService],
  exports: [ShowtimeService, ShowtimeGenerationService],
})
export class ShowtimesModule {}