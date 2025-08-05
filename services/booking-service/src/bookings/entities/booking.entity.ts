import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BookingItem } from './booking-item.entity';

export enum BookingStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELED = 'CANCELED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  showtime_id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'text', default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @OneToMany(() => BookingItem, item => item.booking, { cascade: true })
  items: BookingItem[];
}