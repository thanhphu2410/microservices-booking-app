import { Controller, Inject } from '@nestjs/common';
import { ClientProxy, GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomResponseDto } from './dto/room.dto';

@Controller()
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly roomService: RoomService,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
  ) {}

  @GrpcMethod('RoomService', 'GetAllRooms')
  async getAllRooms(): Promise<{ rooms: RoomResponseDto[] }> {
    try {
      const rooms = await this.roomService.findAllRooms();
      for (const room of rooms) {
        this.seatEventClient.emit('seats_seed', {
          roomId: room.id,
        });
      }
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