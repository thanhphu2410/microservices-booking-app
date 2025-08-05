import { IsUUID, IsArray, ArrayNotEmpty, IsString, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SeatDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(0)
  priceRatio: number;
}

export class CreateBookingDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  showtimeId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  seats: SeatDto[];
}