import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatusEnum } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { ListBookingsResponseDto, BookingResponseDto, ListBookingsDto, GetBookingDto, CreateBookingDto, PayBookingDto, CancelBookingDto, ConfirmBookingDto, ExpiredBookingDto, BookedBookingDto } from './dto/index';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);
  private readonly confirmExpiredTime = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
    @Inject('BOOKING_EVENT_SERVICE') private readonly bookingEventClient: ClientProxy,
    @Inject('SAGA_ORCHESTRATOR') private readonly sagaClient: ClientProxy,
  ) {}

  async listBookings(dto: ListBookingsDto): Promise<ListBookingsResponseDto> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = dto;

    const skip = (page - 1) * limit;

    const [bookings, total] = await this.bookingRepository.findAndCount({
      skip,
      where: { user_id: dto.userId },
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
      relations: ['items'],
    });

    this.logger.log(`Found ${bookings.length} bookings for user ${dto.userId}`);

    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      totalAmount: booking.total_amount,
      status: booking.status,
      createdAt: booking.created_at.toISOString(),
      paidAt: booking.paid_at?.toISOString(),
      confirmExpiredTime: booking.confirm_expired_time?.toISOString(),
      items: booking.items.map(item => ({
        id: item.id,
        seatId: item.seat_id,
        price: item.price,
      })),
    }));

    return {
      bookings: transformedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getBooking(dto: GetBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({
      where: { id: dto.id },
      relations: ['items'],
    });

    return {
      id: booking.id,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      totalAmount: booking.total_amount,
      status: booking.status,
      createdAt: booking.created_at.toISOString(),
      paidAt: booking.paid_at?.toISOString(),
      confirmExpiredTime: booking.confirm_expired_time?.toISOString(),
      items: booking.items.map(item => ({
        id: item.id,
        seatId: item.seat_id,
        price: item.price,
      })),
    };
  }

  async createBooking(dto: CreateBookingDto): Promise<BookingResponseDto> {
    try {
      const basePrice = 12;

      const totalAmount = dto.seats.reduce((total, seat) => {
        const seatPrice = basePrice * seat.priceRatio;
        return total + seatPrice;
      }, 0);

      const booking = this.bookingRepository.create({
        user_id: dto.userId,
        showtime_id: dto.showtimeId,
        total_amount: totalAmount,
        status: BookingStatusEnum.PENDING,
        confirm_expired_time: new Date(Date.now() + this.confirmExpiredTime),
        items: dto.seats.map(seat => {
          const seatPrice = basePrice * seat.priceRatio;
          return this.bookingItemRepository.create({
            seat_id: seat.id,
            price: seatPrice
          });
        }),
      });
      const saved = await this.bookingRepository.save(booking);

      // Emit booking created event to saga orchestrator
      await this.sagaClient.emit('saga_booking_created', {
        eventType: 'SAGA_BOOKING_CREATED',
        bookingId: saved.id,
        sagaId: dto.sagaId,
        userId: dto.userId,
        seatIds: dto.seats.map(seat => seat.id),
        showtimeId: dto.showtimeId,
        totalAmount: totalAmount,
        timestamp: new Date().toISOString(),
      }).toPromise();

      this.logger.log(`Emitted saga_booking_created event for booking ${saved.id} to saga orchestrator`);

      return this.getBooking({ id: saved.id });
    } catch (error) {
      this.logger.error(`CreateBooking failed: ${error.message}`);
      throw error;
    }
  }

  async confirmBooking(dto: ConfirmBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== BookingStatusEnum.PENDING) throw new Error('Booking not in PENDING state');
    booking.status = BookingStatusEnum.PAID;
    booking.paid_at = new Date();
    // Set expiration time to 1 minute from now
    booking.confirm_expired_time = new Date(Date.now() + this.confirmExpiredTime);
    await this.bookingRepository.save(booking);

    // Emit booking_confirmed event to saga orchestrator
    await this.sagaClient.emit('saga_booking_confirmed', {
      eventType: 'SAGA_BOOKING_CONFIRMED',
      bookingId: booking.id,
      sagaId: dto.sagaId,
      success: true,
      message: 'Booking confirmed successfully',
      seatIds: booking.items.map(item => item.seat_id),
      showtimeId: booking.showtime_id,
      userId: booking.user_id,
      timestamp: new Date().toISOString(),
    }).toPromise();

    this.logger.log(`Emitted saga_booking_confirmed event for booking ${booking.id} to saga orchestrator`);

    return this.getBooking({ id: booking.id });
  }

  async bookedBooking(dto: BookedBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatusEnum.BOOKED) throw new Error('Booking already booked');
    booking.status = BookingStatusEnum.BOOKED;
    booking.confirm_expired_time = null; // Clear the expiration time
    await this.bookingRepository.save(booking);

    // Emit booking_booked event to saga orchestrator
    await this.sagaClient.emit('saga_booking_booked', {
      eventType: 'SAGA_BOOKING_BOOKED',
      bookingId: booking.id,
      sagaId: dto.sagaId,
      userId: dto.userId || booking.user_id,
      seatIds: dto.seatIds || booking.items.map(item => item.seat_id),
      showtimeId: dto.showtimeId || booking.showtime_id,
      timestamp: new Date().toISOString(),
    }).toPromise();

    this.logger.log(`Emitted saga_booking_booked event for booking ${booking.id} to saga orchestrator`);

    return this.getBooking({ id: booking.id });
  }

  async cancelBooking(bookingId: string): Promise<void> {
    this.logger.log(`Canceling booking ${bookingId}`);

    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for cancellation`);
      return;
    }

    if (booking.status === BookingStatusEnum.FAILED || booking.status === BookingStatusEnum.CANCELED) {
      this.logger.warn(`Booking ${bookingId} is already canceled or failed`);
      return;
    }

    // Update booking status to FAILED (representing cancellation)
    booking.status = BookingStatusEnum.FAILED;
    booking.confirm_expired_time = null;
    await this.bookingRepository.save(booking);

    this.logger.log(`Booking ${bookingId} canceled successfully`);
  }
}