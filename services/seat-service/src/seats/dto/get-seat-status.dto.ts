import { IsUUID } from 'class-validator';

export class GetSeatStatusDto {
  @IsUUID()
  showtimeId: string;
}