import { IsUUID, IsArray, IsString } from 'class-validator';

export class ReleaseSeatsDto {
  @IsUUID()
  showtimeId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  seatIds: string[];

  @IsString()
  userId: string;
}