import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { RoomType } from '../entities/room.entity';

export class CreateRoomDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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