export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BookingItem {
  id: string;
  seatId: string;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  showtimeId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  items: BookingItem[];
}

export interface ListBookingsRequest { userId: string; }
export interface ListBookingsResponse { bookings: Booking[]; pagination: PaginationInfo; }
export interface GetBookingRequest { id: string; }
export interface GetBookingResponse { booking: Booking; }
export interface SeatRequest {
  id: string;
  priceRatio: number;
}

export interface CreateBookingRequest {
  userId: string;
  showtimeId: string;
  seats: SeatRequest[];
}
export interface CreateBookingResponse { booking: Booking; }
export interface PayBookingRequest { id: string; }
export interface PayBookingResponse { booking: Booking; }
export interface CancelBookingRequest { id: string; }
export interface CancelBookingResponse { booking: Booking; }

export interface BookingGrpcService {
  listBookings(request: ListBookingsRequest): Promise<ListBookingsResponse>;
  getBooking(request: GetBookingRequest): Promise<GetBookingResponse>;
  createBooking(request: CreateBookingRequest): Promise<CreateBookingResponse>;
  payBooking(request: PayBookingRequest): Promise<PayBookingResponse>;
  cancelBooking(request: CancelBookingRequest): Promise<CancelBookingResponse>;
}