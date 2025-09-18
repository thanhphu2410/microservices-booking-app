export interface PaymentEvent {
  eventType: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
  bookingId: string;
  transactionId?: string;
  amount: number;
  timestamp: string;
  userId?: string;
  reason?: string;
}

export interface PaymentSuccessEvent extends PaymentEvent {
  eventType: 'PAYMENT_SUCCESS';
  transactionId: string;
}

export interface PaymentFailedEvent extends PaymentEvent {
  eventType: 'PAYMENT_FAILED';
  reason?: string;
}
