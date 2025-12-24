import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type IdempotencyStatus = 'in_progress' | 'succeeded' | 'failed';

@Entity({ name: 'idempotency_records' })
@Index(['scope', 'key'], { unique: true })
export class IdempotencyRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  scope: string; // logical handler scope, e.g., SAGA:BookingCreated

  @Column({ type: 'varchar', length: 200 })
  key: string; // unique key per logical operation, e.g., sagaId

  @Column({ type: 'varchar', length: 20 })
  status: IdempotencyStatus;

  @Column({ type: 'jsonb', nullable: true })
  responseJson?: any;

  @Column({ type: 'jsonb', nullable: true })
  errorJson?: any;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}



