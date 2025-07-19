import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetSeatLayoutDto {
  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}