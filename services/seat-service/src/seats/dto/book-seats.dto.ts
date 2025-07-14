import { IsUUID, IsArray, IsString } from 'class-validator';

export class BookSeatsDto {
  @IsUUID()
  showtimeId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  seatIds: string[];

  @IsString()
  userId: string;

  @IsString()
  bookingId: string;
}