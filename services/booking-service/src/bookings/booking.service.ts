import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { ListBookingsResponseDto, BookingResponseDto, ListBookingsDto, GetBookingDto, CreateBookingDto, PayBookingDto, CancelBookingDto } from './dto/index';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingItem)
    private readonly bookingItemRepository: Repository<BookingItem>,
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

    const transformedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      showtimeId: booking.showtime_id,
      totalAmount: booking.total_amount,
      status: booking.status,
      createdAt: booking.created_at.toISOString(),
      paidAt: booking.paid_at?.toISOString(),
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
      items: booking.items.map(item => ({
        id: item.id,
        seatId: item.seat_id,
        price: item.price,
      })),
    };
  }

  async createBooking(dto: CreateBookingDto): Promise<BookingResponseDto> {
    // For demo, assume each seat is 100. In real app, fetch seat price from seat-service.
    const pricePerSeat = 100;
    const totalAmount = dto.seatIds.length * pricePerSeat;
    const booking = this.bookingRepository.create({
      user_id: dto.userId,
      showtime_id: dto.showtimeId,
      total_amount: totalAmount,
      status: 'PENDING',
      items: dto.seatIds.map(seat_id =>
        this.bookingItemRepository.create({ seat_id, price: pricePerSeat })
      ),
    });
    const saved = await this.bookingRepository.save(booking);
    return this.getBooking({ id: saved.id });
  }

  async payBooking(dto: PayBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.id }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'PENDING') throw new Error('Booking not in PENDING state');
    booking.status = 'PAID';
    booking.paid_at = new Date();
    await this.bookingRepository.save(booking);
    return this.getBooking({ id: booking.id });
  }

  async cancelBooking(dto: CancelBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.id }, relations: ['items'] });
    if (!booking) throw new Error('Booking not found');
    if (booking.status === 'CANCELED') throw new Error('Booking already canceled');
    booking.status = 'CANCELED';
    await this.bookingRepository.save(booking);
    return this.getBooking({ id: booking.id });
  }
}