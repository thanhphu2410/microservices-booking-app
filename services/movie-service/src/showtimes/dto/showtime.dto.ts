import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { ShowtimeStatus } from '../entities/showtime.entity';

export class CreateShowtimeDto {
  @IsString()
  movieId: string;

  @IsString()
  roomId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsEnum(ShowtimeStatus)
  status?: ShowtimeStatus;
}

export class UpdateShowtimeDto {
  @IsOptional()
  @IsString()
  movieId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsEnum(ShowtimeStatus)
  status?: ShowtimeStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bookedSeats?: number;
}

export class ShowtimeResponseDto {
  id: string;
  movieId: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  price: number;
  status: ShowtimeStatus;
  createdAt: Date;
  updatedAt: Date;
  movie?: any;
  room?: any;
}

export class ListShowtimesDto {
  @IsOptional()
  @IsString()
  movieId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsEnum(ShowtimeStatus)
  status?: ShowtimeStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}