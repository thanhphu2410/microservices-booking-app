import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { CreateShowtimeDto, UpdateShowtimeDto, ShowtimeResponseDto, ListShowtimesDto } from './dto/showtime.dto';

@Controller()
export class ShowtimeController {
  private readonly logger = new Logger(ShowtimeController.name);

  constructor(
    private readonly showtimeService: ShowtimeService,
  ) {}

  @GrpcMethod('ShowtimeService', 'CreateShowtime')
  async createShowtime(data: CreateShowtimeDto): Promise<ShowtimeResponseDto> {
    try {
      this.logger.log(`Creating showtime for movie: ${data.movieId}`);
      const result = await this.showtimeService.createShowtime(data);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'CreateShowtime failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'GetAllShowtimes')
  async getAllShowtimes(data: ListShowtimesDto = {}): Promise<{ showtimes: ShowtimeResponseDto[] }> {
    try {
      this.logger.log('Fetching all showtimes');
      const showtimes = await this.showtimeService.findAllShowtimes(data);
      return { showtimes };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetAllShowtimes failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'GetShowtimeById')
  async getShowtimeById(data: { id: string }): Promise<ShowtimeResponseDto> {
    try {
      this.logger.log(`Fetching showtime by id: ${data.id}`);
      const result = await this.showtimeService.findShowtimeById(data.id);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetShowtimeById failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'GetUpcomingShowtimes')
  async getUpcomingShowtimes(): Promise<{ showtimes: ShowtimeResponseDto[] }> {
    try {
      this.logger.log('Fetching upcoming showtimes');
      const showtimes = await this.showtimeService.findUpcomingShowtimes();
      return { showtimes };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetUpcomingShowtimes failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'UpdateShowtime')
  async updateShowtime(data: { id: string; updateData: UpdateShowtimeDto }): Promise<ShowtimeResponseDto> {
    try {
      this.logger.log(`Updating showtime: ${data.id}`);
      const result = await this.showtimeService.updateShowtime(data.id, data.updateData);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'UpdateShowtime failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'DeleteShowtime')
  async deleteShowtime(data: { id: string }): Promise<{ message: string }> {
    try {
      this.logger.log(`Deleting showtime: ${data.id}`);
      await this.showtimeService.deleteShowtime(data.id);
      return { message: 'Showtime deleted successfully' };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'DeleteShowtime failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'CancelShowtime')
  async cancelShowtime(data: { id: string }): Promise<ShowtimeResponseDto> {
    try {
      this.logger.log(`Cancelling showtime: ${data.id}`);
      const result = await this.showtimeService.cancelShowtime(data.id);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'CancelShowtime failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('ShowtimeService', 'UpdateBookedSeats')
  async updateBookedSeats(data: { id: string; bookedSeats: number }): Promise<ShowtimeResponseDto> {
    try {
      this.logger.log(`Updating booked seats for showtime: ${data.id}`);
      const result = await this.showtimeService.updateBookedSeats(data.id, data.bookedSeats);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'UpdateBookedSeats failed',
        details: error.message,
      });
    }
  }
}