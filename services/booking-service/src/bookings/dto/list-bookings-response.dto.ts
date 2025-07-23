export interface BookingItem {
  id: string;
  seatId: string;
  price: number;
}

export class BookingResponseDto {
  id: string;
  userId: string;
  showtimeId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  items: BookingItem[];
}

export class PaginationInfoDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ListBookingsResponseDto {
  bookings: BookingResponseDto[];
  pagination: PaginationInfoDto;
}