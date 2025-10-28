import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SagaStep } from './saga-step.entity';

export enum SagaStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('saga_instance')
export class SagaInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  saga_type: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    enum: SagaStatus,
    comment: 'PENDING, IN_PROGRESS, COMPLETED, FAILED'
  })
  status: SagaStatus;

  @Column({ type: 'int', nullable: false })
  current_step: number;

  @Column({ type: 'jsonb', nullable: true})
  payload: any;

  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  updated_at: Date;

  @OneToMany(() => SagaStep, (step) => step.saga_instance)
  steps: SagaStep[];
}
