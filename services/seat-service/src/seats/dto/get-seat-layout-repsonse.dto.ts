export class GetSeatLayoutResponseDto {
  seats: {
    id: string,
    row: string,
    column: string,
    type: string,
    priceRatio: number,
    description: string,
  }[];
  roomId: string;
}