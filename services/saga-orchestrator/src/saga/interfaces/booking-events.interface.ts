export interface ConfirmBookingEvent {
  eventType: 'CONFIRM_BOOKING';
  bookingId: string;
  sagaId: string;
  transactionId: string;
  amount: number;
  userId?: string;
  timestamp: string;
}

export interface BookingConfirmedEvent {
  eventType: 'SAGA_BOOKING_CONFIRMED';  // Changed from BOOKING_CONFIRMED to SAGA_BOOKING_CONFIRMED
  bookingId: string;
  sagaId: string;
  success: boolean;
  message?: string;
  seatIds?: string[];
  showtimeId?: string;
  userId?: string;
  timestamp: string;
}

export interface BookingFailedEvent {
  eventType: 'BOOKING_FAILED';
  bookingId: string;
  sagaId?: string;  // Optional - we'll try to find saga by bookingId if not provided
  reason?: string;  // Optional - default message will be used if not provided
  timestamp: string;
}

export interface SeatsBookedEvent {
  eventType: 'SEATS_BOOKED';
  bookingId: string;
  sagaId: string;
  seatIds: string[];
  showtimeId: string;
  userId?: string;
  timestamp: string;
}

export interface BookingBookedEvent {
  eventType: 'SAGA_BOOKING_BOOKED';  // Changed from BOOKING_BOOKED to SAGA_BOOKING_BOOKED
  bookingId: string;
  sagaId: string;
  userId?: string;
  seatIds?: string[];
  showtimeId?: string;
  timestamp: string;
}

export interface BookingCreatedEvent {
  eventType: 'SAGA_BOOKING_CREATED';
  bookingId: string;
  sagaId: string;
  userId: string;
  seatIds: string[];
  showtimeId: string;
  totalAmount: number;
  timestamp: string;
}

export interface BookingCompleteEvent {
  eventType: 'BOOKING_COMPLETE';
  bookingId: string;
  sagaId: string;
  userId: string;
  seatIds: string[];
  showtimeId: string;
  timestamp: string;
}
