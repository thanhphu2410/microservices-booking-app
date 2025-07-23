export class GetSeatStatusResponseDto {
  seats: {
    seatId: string,
    row: string,
    column: string,
    type: string,
    priceRatio: number,
    status: string,
    userId: string,
    bookingId: string,
    holdExpiresAt: string,
  }[];
  showtimeId: string;
}