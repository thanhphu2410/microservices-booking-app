import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { BookingsService } from './booking.service';
import { ClientProxy } from '@nestjs/microservices';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListBookingsDto, GetBookingDto, CreateBookingDto, PayBookingDto, CancelBookingDto } from './dto/index';

@Controller()
export class BookingsController {
  private readonly logger = new Logger(BookingsController.name);

  constructor(
    private readonly bookingsService: BookingsService,
    @Inject('BOOKING_EVENT_SERVICE') private readonly bookingEventClient: ClientProxy,
  ) {}

  private async validateDto<T>(data: any, dto: new () => T): Promise<T> {
    const instance = plainToInstance(dto, data);
    const errors = await validate(instance as object);
    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => Object.values(error.constraints || {}))
        .flat()
        .filter(Boolean);
      throw new RpcException({
        message: errorMessages.join(', '),
        details: errorMessages,
      });
    }
    return instance;
  }

  @GrpcMethod('BookingService', 'ListBookings')
  async listBookings(data: ListBookingsDto) {
    try {
      const dto = await this.validateDto(data, ListBookingsDto);
      return await this.bookingsService.listBookings(dto);
    } catch (error) {
      throw new RpcException({
        message: 'ListBookings failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('BookingService', 'GetBooking')
  async getBooking(data: GetBookingDto) {
    try {
      const dto = await this.validateDto(data, GetBookingDto);
      const booking = await this.bookingsService.getBooking(dto);
      return { booking };
    } catch (error) {
      throw new RpcException({
        message: 'GetBooking failed',
        details: error.message,
      });
    }
  }
}