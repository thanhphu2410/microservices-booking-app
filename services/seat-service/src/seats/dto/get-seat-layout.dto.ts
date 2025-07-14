import { IsUUID } from 'class-validator';

export class GetSeatLayoutDto {
  @IsUUID()
  roomId: string;
}