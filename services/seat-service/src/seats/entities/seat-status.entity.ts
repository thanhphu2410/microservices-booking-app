import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Seat } from './seat.entity';

export enum SeatStatusEnum {
  AVAILABLE = 'AVAILABLE',
  HOLD = 'HOLD',
  BOOKED = 'BOOKED',
}

@Entity('seat_statuses')
export class SeatStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seatId: string;

  @Column()
  showtimeId: string;

  @Column({
    type: 'enum',
    enum: SeatStatusEnum,
    default: SeatStatusEnum.AVAILABLE,
  })
  status: SeatStatusEnum;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  bookingId: string;

  @Column({ nullable: true })
  holdExpiresAt: Date;

  @ManyToOne(() => Seat, seat => seat.id)
  @JoinColumn({ name: 'seatId' })
  seat: Seat;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}