import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResponseDto } from './dto/room.dto';

@Controller()
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly roomService: RoomService,
  ) {}

  @GrpcMethod('RoomService', 'GetAllRooms')
  async getAllRooms(): Promise<{ rooms: RoomResponseDto[] }> {
    try {
      this.logger.log('Fetching all rooms');
      const rooms = await this.roomService.findAllRooms();
      return { rooms };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetAllRooms failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('RoomService', 'GetRoomById')
  async getRoomById(data: { id: string }): Promise<RoomResponseDto> {
    try {
      this.logger.log(`Fetching room by id: ${data.id}`);
      const result = await this.roomService.findRoomById(data.id);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetRoomById failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('RoomService', 'GetActiveRooms')
  async getActiveRooms(): Promise<{ rooms: RoomResponseDto[] }> {
    try {
      this.logger.log('Fetching active rooms');
      const rooms = await this.roomService.findActiveRooms();
      return { rooms };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'GetActiveRooms failed',
        details: error.message,
      });
    }
  }
}