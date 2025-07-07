import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoomDto, UpdateRoomDto, RoomResponseDto } from './dto/room.dto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto): Promise<RoomResponseDto> {
    this.logger.log(`Creating room: ${createRoomDto.name}`);

    // Check if room with same name already exists
    const existingRoom = await this.roomRepository.findOne({
      where: { name: createRoomDto.name }
    });

    if (existingRoom) {
      throw new BadRequestException(`Room with name '${createRoomDto.name}' already exists`);
    }

    const room = this.roomRepository.create(createRoomDto);
    const savedRoom = await this.roomRepository.save(room);

    this.logger.log(`Room created successfully: ${savedRoom.id}`);

    return this.mapToResponseDto(savedRoom);
  }

  async findAllRooms(): Promise<RoomResponseDto[]> {
    this.logger.log('Fetching all rooms');

    const rooms = await this.roomRepository.find({
      order: { name: 'ASC' }
    });

    return rooms.map(room => this.mapToResponseDto(room));
  }

  async findRoomById(id: string): Promise<RoomResponseDto> {
    this.logger.log(`Fetching room by id: ${id}`);

    const room = await this.roomRepository.findOne({
      where: { id }
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${id}' not found`);
    }

    return this.mapToResponseDto(room);
  }

  async findActiveRooms(): Promise<RoomResponseDto[]> {
    this.logger.log('Fetching active rooms');

    const rooms = await this.roomRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });

    return rooms.map(room => this.mapToResponseDto(room));
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<RoomResponseDto> {
    this.logger.log(`Updating room: ${id}`);

    const room = await this.roomRepository.findOne({
      where: { id }
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${id}' not found`);
    }

    // Check if name is being updated and if it conflicts with existing room
    if (updateRoomDto.name && updateRoomDto.name !== room.name) {
      const existingRoom = await this.roomRepository.findOne({
        where: { name: updateRoomDto.name }
      });

      if (existingRoom) {
        throw new BadRequestException(`Room with name '${updateRoomDto.name}' already exists`);
      }
    }

    Object.assign(room, updateRoomDto);
    const updatedRoom = await this.roomRepository.save(room);

    this.logger.log(`Room updated successfully: ${id}`);

    return this.mapToResponseDto(updatedRoom);
  }

  async deleteRoom(id: string): Promise<void> {
    this.logger.log(`Deleting room: ${id}`);

    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['showtimes']
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${id}' not found`);
    }

    // Check if room has any showtimes
    if (room.showtimes && room.showtimes.length > 0) {
      throw new BadRequestException(`Cannot delete room with existing showtimes. Please cancel all showtimes first.`);
    }

    await this.roomRepository.remove(room);

    this.logger.log(`Room deleted successfully: ${id}`);
  }

  async deactivateRoom(id: string): Promise<RoomResponseDto> {
    this.logger.log(`Deactivating room: ${id}`);

    const room = await this.roomRepository.findOne({
      where: { id }
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${id}' not found`);
    }

    room.isActive = false;
    const updatedRoom = await this.roomRepository.save(room);

    this.logger.log(`Room deactivated successfully: ${id}`);

    return this.mapToResponseDto(updatedRoom);
  }

  private mapToResponseDto(room: Room): RoomResponseDto {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      isActive: room.isActive,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      total_rows: room.total_rows,
      total_cols: room.total_cols,
    };
  }
}