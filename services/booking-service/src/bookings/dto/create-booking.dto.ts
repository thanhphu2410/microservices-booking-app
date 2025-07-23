import { IsUUID, IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  showtimeId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  seatIds: string[];
}