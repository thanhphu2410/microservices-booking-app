import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { BookingItem } from './booking-item.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  showtime_id: string;

  @Column('int')
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