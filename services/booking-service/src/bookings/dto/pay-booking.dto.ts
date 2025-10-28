import { IsUUID } from 'class-validator';

export class PayBookingDto {
  @IsUUID()
  id: string;
}

export class ConfirmBookingDto {
  @IsUUID()
  bookingId: string;

  @IsUUID()
  sagaId: string;
}
export class ExpiredBookingDto {
  @IsUUID()
  bookingId: string;
}

export class BookedBookingDto {
  @IsUUID()
  bookingId: string;

  @IsUUID()
  sagaId: string;

  userId?: string;

  seatIds?: string[];

  showtimeId?: string;
}