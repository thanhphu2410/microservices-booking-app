import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SagaInstance } from './saga-instance.entity';

export enum StepStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

@Entity('saga_step')
export class SagaStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  saga_id: string;

  @Column({ type: 'int', nullable: false})
  step_order: number;

  @Column({ type: 'varchar', length: 100, nullable: false})
  step_name: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    enum: StepStatus,
    comment: 'PENDING, SUCCESS, FAILED, COMPENSATED'
  })
  status: StepStatus;

  @Column({ type: 'jsonb', nullable: true })
  request_payload: any;

  @Column({ type: 'jsonb', nullable: true })
  response_payload: any;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  finished_at: Date;

  @ManyToOne(() => SagaInstance, (saga) => saga.steps)
  @JoinColumn({ name: 'saga_id' })
  saga_instance: SagaInstance;
}
