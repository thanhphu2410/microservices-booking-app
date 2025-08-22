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

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
    @Inject('BOOKING_EVENT_SERVICE') private readonly bookingEventClient: ClientProxy,
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
    // Check if any of the requested seats are already booked for this showtime
    try {
      const bookedSeats = await this.bookingItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.booking', 'booking')
      .where('item.seat_id IN (:...seatIds)', { seatIds: dto.seats.map(seat => seat.id) })
      .andWhere('booking.showtime_id = :showtimeId', { showtimeId: dto.showtimeId })
      .andWhere('booking.status != :cancelled', { cancelled: BookingStatusEnum.CANCELED })
      .getMany();


      if (bookedSeats.length > 0) {
        throw new Error(`Some seats are already booked: ${bookedSeats.map(s => s.seat_id).join(', ')}`);
      }
      // Base price for seats, in real app this could come from seat-service or showtime configuration
      const basePrice = 12;

      // Calculate total amount based on seat price ratios
      const totalAmount = dto.seats.reduce((total, seat) => {
        const seatPrice = basePrice * seat.priceRatio;
        return total + seatPrice;
      }, 0);

      const booking = this.bookingRepository.create({
        user_id: dto.userId,
        showtime_id: dto.showtimeId,
        total_amount: totalAmount,
        status: BookingStatusEnum.PENDING,
        items: dto.seats.map(seat => {
          const seatPrice = basePrice * seat.priceRatio;
          return this.bookingItemRepository.create({
            seat_id: seat.id,
            price: seatPrice
          });
        }),
      });
      const saved = await this.bookingRepository.save(booking);
      return this.getBooking({ id: saved.id });
    } catch (error) {
      this.logger.error(`CreateBooking failed: ${error.message}`);
    }
  }

  async payBooking(dto: PayBookingDto): Promise<any> {
    this.bookingEventClient.emit('payment_succeeded', {
      bookingId: dto.id,
    });

    return {
      id: dto.id,
      message: 'Payment succeeded',
    }
  }

  async confirmBooking(dto: ConfirmBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== BookingStatusEnum.PENDING) throw new Error('Booking not in PENDING state');
    booking.status = BookingStatusEnum.PAID;
    booking.paid_at = new Date();
    // Set expiration time to 1 minute from now
    booking.confirm_expired_time = new Date(Date.now() + 60 * 1000);
    await this.bookingRepository.save(booking);

    this.seatEventClient.emit('booking_confirmed', {
      bookingId: booking.id,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      seatIds: booking.items.map(item => item.seat_id),
    });

    return this.getBooking({ id: booking.id });
  }

  async cancelBooking(dto: CancelBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.id }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatusEnum.CANCELED) throw new Error('Booking already canceled');
    booking.status = BookingStatusEnum.CANCELED;
    booking.confirm_expired_time = null; // Clear the expiration time
    await this.bookingRepository.save(booking);

    this.seatEventClient.emit('booking_canceled', {
      bookingId: booking.id,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      seatIds: booking.items.map(item => item.seat_id),
    });

    return this.getBooking({ id: booking.id });
  }

  async failedBooking(dto: ExpiredBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatusEnum.FAILED) throw new Error('Booking already failed');
    booking.status = BookingStatusEnum.FAILED;
    booking.confirm_expired_time = null; // Clear the expiration time
    await this.bookingRepository.save(booking);

    this.bookingEventClient.emit('booking_failed', {
      bookingId: booking.id
    });
    return this.getBooking({ id: booking.id });
  }

  async bookedBooking(dto: BookedBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === BookingStatusEnum.BOOKED) throw new Error('Booking already booked');
    booking.status = BookingStatusEnum.BOOKED;
    booking.confirm_expired_time = null; // Clear the expiration time
    await this.bookingRepository.save(booking);
    return this.getBooking({ id: booking.id });
  }
}