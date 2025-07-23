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
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller()
export class SeatsController {
  private readonly logger = new Logger(SeatsController.name);

  constructor(
    private readonly seatsService: SeatsService,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
  ) {}

  private async validateDto<T>(data: any, dto: new () => T): Promise<T> {
    const instance = plainToInstance(dto, data);
    const errors = await validate(instance as object);
    
    if (errors.length > 0) {
      this.logger.error(`Errors : ${errors}`);
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

  @GrpcMethod('SeatService', 'GetSeatLayout')
  async getSeatLayout(data: GetSeatLayoutDto) {
    try {
      const layoutDto = await this.validateDto(data, GetSeatLayoutDto);
      const result = await this.seatsService.getSeatLayout(layoutDto);
      return result;
    } catch (error) {
      throw new RpcException({
        message: 'GetSeatLayout failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('SeatService', 'GetSeatStatus')
  async getSeatStatus(data: GetSeatStatusDto) {
    try {
      const getSeatStatusDto = await this.validateDto(data, GetSeatStatusDto);
      const result = await this.seatsService.getSeatStatus(getSeatStatusDto);
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
      const holdSeatsDto = await this.validateDto(data, HoldSeatsDto);
      const result = await this.seatsService.holdSeats(holdSeatsDto);
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
      const bookSeatsDto = await this.validateDto(data, BookSeatsDto);
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

  @GrpcMethod('SeatService', 'SeedSeats')
  async seedSeats() {
    try {
      // const result = await this.seatsService.seed();
      // return result;
    } catch (error) {
      this.logger.error(`SeedSeats failed: ${error.message}`);
      throw new RpcException({
        message: 'SeedSeats failed',
        details: error.message,
      });
    }
  }
}