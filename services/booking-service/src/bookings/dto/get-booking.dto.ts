import { IsUUID } from 'class-validator';

export class GetBookingDto {
  @IsUUID()
  id: string;
}