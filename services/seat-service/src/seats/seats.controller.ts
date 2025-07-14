import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { ClientProxy } from '@nestjs/microservices';
import {
  GetSeatLayoutDto,
  GetSeatStatusDto,
  HoldSeatsDto,
  BookSeatsDto,
  ReleaseSeatsDto,
} from './dto';

@Controller()
export class SeatsController {
  private readonly logger = new Logger(SeatsController.name);

  constructor(
    private readonly seatsService: SeatsService,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
  ) {}

  @GrpcMethod('SeatService', 'GetSeatLayout')
  async getSeatLayout(data: GetSeatLayoutDto) {
    try {
      const result = await this.seatsService.getSeatLayout(data);
      return result;
    } catch (error) {
      this.logger.error(`GetSeatLayout failed: ${error.message}`);
      throw new RpcException({
        message: 'GetSeatLayout failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('SeatService', 'GetSeatStatus')
  async getSeatStatus(data: GetSeatStatusDto) {
    try {
      const result = await this.seatsService.getSeatStatus(data);
      return result;
    } catch (error) {
      this.logger.error(`GetSeatStatus failed: ${error.message}`);
      throw new RpcException({
        message: 'GetSeatStatus failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('SeatService', 'HoldSeats')
  async holdSeats(data: HoldSeatsDto) {
    try {
      const result = await this.seatsService.holdSeats(data);
      return result;
    } catch (error) {
      this.logger.error(`HoldSeats failed: ${error.message}`);
      throw new RpcException({
        message: 'HoldSeats failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('SeatService', 'BookSeats')
  async bookSeats(data: BookSeatsDto) {
    try {
      const result = await this.seatsService.bookSeats(data);
      return result;
    } catch (error) {
      this.logger.error(`BookSeats failed: ${error.message}`);
      throw new RpcException({
        message: 'BookSeats failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('SeatService', 'ReleaseSeats')
  async releaseSeats(data: ReleaseSeatsDto) {
    try {
      const result = await this.seatsService.releaseSeats(data);
      return result;
    } catch (error) {
      this.logger.error(`ReleaseSeats failed: ${error.message}`);
      throw new RpcException({
        message: 'ReleaseSeats failed',
        details: error.message,
      });
    }
  }
}