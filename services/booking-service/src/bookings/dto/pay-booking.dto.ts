import { IsUUID } from 'class-validator';

export class PayBookingDto {
  @IsUUID()
  id: string;
}