import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class RoomResponseDto {
  id: string;
  name: string;
  total_rows: number;
  total_cols: number;
  type: RoomType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}