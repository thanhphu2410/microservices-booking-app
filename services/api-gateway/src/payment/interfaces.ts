export interface PaymentRequest {
  amount: number;
  bookingId: string;
}

export interface PaymentResponse {
  status: 'success' | 'failed';
  bookingId: string;
  transactionId?: string;
  message: string;
}

export interface PaymentCallbackRequest {
  bookingId: string;
  transactionId: string;
  status: 'success' | 'failed';
  amount: number;
}
