import { IsString } from 'class-validator';
import { ShowtimeResponseDto } from '../../showtimes/dto/showtime.dto';

export class GetMovieShowtimesDto {
  @IsString()
  movieId: string;
}

export class GetMovieShowtimesResponseDto {
  showtimes: ShowtimeResponseDto[];
}

export class MovieShowtimeRoomDto {
  id: string;
  name: string;
}

export class MovieShowtimeItemDto {
  showtimeId: string;
  room: MovieShowtimeRoomDto;
  startTime: string;
  basePrice: number;
}

export class MovieShowtimesResponseDto {
  movieId: string;
  title: string;
  showtimes: MovieShowtimeItemDto[];
}