import { IsUUID, IsArray, ArrayNotEmpty, IsString, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SeatDto {
  @IsString()
  id: string;

  @IsNumber()
  @Min(0)
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
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