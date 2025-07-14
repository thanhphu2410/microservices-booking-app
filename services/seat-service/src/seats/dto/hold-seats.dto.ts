import { IsUUID, IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class HoldSeatsDto {
  @IsUUID()
  showtimeId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  seatIds: string[];

  @IsString()
  userId: string;

  @IsOptional()
  @IsNumber()
  holdDurationMinutes?: number;
}