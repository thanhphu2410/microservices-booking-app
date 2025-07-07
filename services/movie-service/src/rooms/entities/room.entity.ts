import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

export enum RoomType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  IMAX = 'imax',
  DOLBY = 'dolby',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: 10 })
  total_rows: number;

  @Column({ default: 10 })
  total_cols: number;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.STANDARD
  })
  type: RoomType;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Showtime, showtime => showtime.room)
  showtimes: Showtime[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}