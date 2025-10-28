/**
 * Interface definitions for seat service events
 */

export interface BookingConfirmedToSeatEvent {
  eventType: 'BOOKING_CONFIRMED';  // This is saga-to-service, keep plain name
  bookingId: string;
  sagaId: string;
  seatIds: string[];
  showtimeId: string;
  userId: string;
  timestamp: string;
}

export interface SeatReleaseEvent {
  eventType: 'RELEASE_SEATS';
  bookingId: string;
  sagaId: string;
  seatIds: string[];
  reason: string;
  timestamp: string;
}

export interface SeatConfirmedEvent {
  eventType: 'SAGA_SEAT_CONFIRMED';  // Changed from SEAT_CONFIRMED to SAGA_SEAT_CONFIRMED
  bookingId: string;
  sagaId: string;
  seatIds: string[];
  showtimeId: string;
  userId: string;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface SeatInfo {
  id: string;
  priceRatio: number;
}

export interface SeatsHeldEvent {
  eventType: 'SAGA_SEATS_HELD';  // Changed from SEATS_HELD to SAGA_SEATS_HELD
  bookingId?: string;
  seats: SeatInfo[];
  showtimeId: string;
  userId: string;
  holdExpiresAt?: string;
  timestamp: string;
}

export type SeatEvent = BookingConfirmedToSeatEvent | SeatReleaseEvent | SeatConfirmedEvent | SeatsHeldEvent;
