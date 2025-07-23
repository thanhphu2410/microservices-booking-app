import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomResponseDto } from './dto/room.dto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async findAllRooms(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.find({
      order: { id: 'asc' }
    });

    return rooms.map(room => this.mapToResponseDto(room));
  }

  async findRoomById(id: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id }
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${id}' not found`);
    }

    return this.mapToResponseDto(room);
  }

  async findActiveRooms(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });

    return rooms.map(room => this.mapToResponseDto(room));
  }

  private mapToResponseDto(room: Room): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      totalRows: room.total_rows,
      totalCols: room.total_cols,
    };
  }
}