export interface GetSeatLayoutRequest { roomId: string; }
export interface GetSeatLayoutResponse { seats: any[]; roomId: string; }

export interface GetSeatStatusRequest { showtimeId: string; }
export interface GetSeatStatusResponse { seats: any[]; showtimeId: string; }

export interface HoldSeatsRequest { showtimeId: string; seatIds: string[]; userId: string; holdDurationMinutes?: number; }
export interface HoldSeatsResponse { success: boolean; heldSeatIds: string[]; failedSeatIds: string[]; message: string; }

export interface BookSeatsRequest { showtimeId: string; seatIds: string[]; userId: string; bookingId: string; }
export interface BookSeatsResponse { success: boolean; bookedSeatIds: string[]; failedSeatIds: string[]; message: string; }

export interface ReleaseSeatsRequest { showtimeId: string; seatIds: string[]; userId: string; }
export interface ReleaseSeatsResponse { success: boolean; releasedSeatIds: string[]; failedSeatIds: string[]; message: string; }

export interface SeedSeatsRequest { }
export interface SeedSeatsResponse { }

export interface SeatGrpcService {
  getSeatLayout(data: GetSeatLayoutRequest): Promise<GetSeatLayoutResponse>;
  getSeatStatus(data: GetSeatStatusRequest): Promise<GetSeatStatusResponse>;
  holdSeats(data: HoldSeatsRequest): Promise<HoldSeatsResponse>;
  bookSeats(data: BookSeatsRequest): Promise<BookSeatsResponse>;
  releaseSeats(data: ReleaseSeatsRequest): Promise<ReleaseSeatsResponse>;
  seedSeats(data: SeedSeatsRequest): Promise<SeedSeatsResponse>;
}