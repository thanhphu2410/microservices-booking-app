import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto, UpdateRoomDto, RoomResponseDto } from './dto/room.dto';

@Controller()
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(
    private readonly roomService: RoomService,
  ) {}

  @GrpcMethod('RoomService', 'CreateRoom')
  async createRoom(data: CreateRoomDto): Promise<RoomResponseDto> {
    try {
      this.logger.log(`Creating room: ${data.name}`);
      const result = await this.roomService.createRoom(data);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'CreateRoom failed',
        details: error.message,
      });
    }
  }

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

  @GrpcMethod('RoomService', 'UpdateRoom')
  async updateRoom(data: { id: string; updateData: UpdateRoomDto }): Promise<RoomResponseDto> {
    try {
      this.logger.log(`Updating room: ${data.id}`);
      const result = await this.roomService.updateRoom(data.id, data.updateData);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'UpdateRoom failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('RoomService', 'DeleteRoom')
  async deleteRoom(data: { id: string }): Promise<{ message: string }> {
    try {
      this.logger.log(`Deleting room: ${data.id}`);
      await this.roomService.deleteRoom(data.id);
      return { message: 'Room deleted successfully' };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'DeleteRoom failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('RoomService', 'DeactivateRoom')
  async deactivateRoom(data: { id: string }): Promise<RoomResponseDto> {
    try {
      this.logger.log(`Deactivating room: ${data.id}`);
      const result = await this.roomService.deactivateRoom(data.id);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'DeactivateRoom failed',
        details: error.message,
      });
    }
  }
}