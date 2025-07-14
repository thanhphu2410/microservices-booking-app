import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SeatType {
  NORMAL = 'NORMAL',
  VIP = 'VIP',
  PREMIUM = 'PREMIUM',
  WHEELCHAIR = 'WHEELCHAIR',
}

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  row: string;

  @Column()
  column: number;

  @Column({
    type: 'enum',
    enum: SeatType,
    default: SeatType.NORMAL,
  })
  type: SeatType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1.0 })
  priceRatio: number;

  @Column({ nullable: true })
  description: string;

  @Column()
  roomId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}