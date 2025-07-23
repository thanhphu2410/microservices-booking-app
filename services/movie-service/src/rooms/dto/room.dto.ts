import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class RoomResponseDto {
  id: string;
  name: string;
  totalRows: number;
  totalCols: number;
  type: RoomType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}