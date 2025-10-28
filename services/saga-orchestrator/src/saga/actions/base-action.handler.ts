import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';
@Injectable()
export abstract class BaseActionHandler {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(SagaInstance)
    protected readonly sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    protected readonly sagaStepRepository: Repository<SagaStep>,
  ) {}

  protected async createSaga(sagaType: string, payload: any): Promise<SagaInstance> {
    const saga = this.sagaInstanceRepository.create({
      saga_type: sagaType,
      status: SagaStatus.PENDING,
      current_step: 0,
      payload,
    });

    const savedSaga = await this.sagaInstanceRepository.save(saga);
    this.logger.log(`Created new saga: ${savedSaga.id} of type: ${sagaType}`);

    return savedSaga;
  }

  protected async createSagaStep(
    sagaId: string,
    stepName: string,
    requestPayload?: any,
  ): Promise<SagaStep> {
    const { max: maxOrderRaw } = await this.sagaStepRepository
      .createQueryBuilder('step')
      .select('MAX(step.step_order)', 'max')
      .where('step.saga_id = :sagaId', { sagaId })
      .getRawOne<{ max: number | null }>();

    const nextStepOrder = (maxOrderRaw ?? 0) + 1;

    const step = this.sagaStepRepository.create({
      saga_id: sagaId,
      step_order: nextStepOrder,
      step_name: stepName,
      status: StepStatus.PENDING,
      request_payload: requestPayload,
      started_at: new Date(),
    });

    const savedStep = await this.sagaStepRepository.save(step);
    this.logger.log(`Created saga step: ${savedStep.id} for saga: ${sagaId}, step: ${stepName}`);

    return savedStep;
  }

  protected async updateSagaStep(
    stepId: string,
    status: StepStatus,
    responsePayload?: any,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<SagaStep> = {
      status,
      finished_at: new Date(),
    };

    if (responsePayload) {
      updateData.response_payload = responsePayload;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await this.sagaStepRepository.update(stepId, updateData);
    this.logger.log(`Updated saga step: ${stepId} to status: ${status}`);
  }

  protected async getSagaById(sagaId: string): Promise<SagaInstance | null> {
    return this.sagaInstanceRepository.findOne({
      where: { id: sagaId },
      relations: ['steps'],
      order: { steps: { step_order: 'ASC' } },
    });
  }

  protected async getSagaByBookingId(bookingId: string): Promise<SagaInstance | null> {
    return this.sagaInstanceRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.steps', 'steps')
      .innerJoin('s.steps', 'createStep', 'createStep.step_name = :stepName AND createStep.status = :stepStatus', {
        stepName: 'create_booking',
        stepStatus: StepStatus.SUCCESS
      })
      .where('createStep.response_payload ->> :payloadKey = :bookingId', {
        payloadKey: 'bookingId',
        bookingId
      })
      .orderBy('steps.step_order', 'ASC')
      .getOne();
  }

  protected async updateSagaStatus(
    sagaId: string,
    status: SagaStatus,
    currentStep?: number,
  ): Promise<void> {
    const updateData: Partial<SagaInstance> = { status };

    if (currentStep !== undefined) {
      updateData.current_step = currentStep;
    }

    await this.sagaInstanceRepository.update(sagaId, updateData);
    this.logger.log(`Updated saga: ${sagaId} to status: ${status}`);
  }

  abstract handle(event: any): Promise<void>;
}
