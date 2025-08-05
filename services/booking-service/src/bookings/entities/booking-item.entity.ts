import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_items')
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  booking_id: string;

  @Column()
  seat_id: string;

  @Column('int')
  price: number;

  @ManyToOne(() => Booking, booking => booking.items, { cascade: false })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}