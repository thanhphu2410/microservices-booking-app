import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BaseActionHandler } from './base-action.handler';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';
import { BookingCreatedEvent } from '../interfaces/booking-events.interface';

@Injectable()
export class BookingCreatedActionHandler extends BaseActionHandler {
  constructor(
    @InjectRepository(SagaInstance)
    sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    sagaStepRepository: Repository<SagaStep>,
  ) {
    super(sagaInstanceRepository, sagaStepRepository);
  }

  async handle(event: BookingCreatedEvent): Promise<void> {
    this.logger.log(`Handling booking created event for booking ${event.bookingId} in saga ${event.sagaId}`);

    try {
      // Find the saga by ID
      const saga = await this.getSagaById(event.sagaId);
      if (!saga) {
        this.logger.warn(`Saga ${event.sagaId} not found for booking ${event.bookingId}`);
        return;
      }

      // Update saga payload with booking ID
      const updatedPayload = {
        ...saga.payload,
        bookingId: event.bookingId,
        totalAmount: event.totalAmount,
      };

      await this.sagaInstanceRepository.update(saga.id, {
        payload: updatedPayload,
      });

      // Find and update the create_booking step
      const createBookingStep = saga.steps.find(step => step.step_name === 'create_booking');
      if (!createBookingStep) {
        this.logger.warn(`Create booking step not found in saga ${event.sagaId}`);
        return;
      }

      await this.updateSagaStep(
        createBookingStep.id,
        StepStatus.SUCCESS,
        {
          message: 'Booking created successfully',
          bookingId: event.bookingId,
          totalAmount: event.totalAmount,
          createdAt: new Date().toISOString(),
        }
      );

      this.logger.log(`Booking ${event.bookingId} created successfully. Saga ${event.sagaId} updated with booking ID and moved to payment step.`);

    } catch (error) {
      this.logger.error(`Failed to handle booking created event for booking ${event.bookingId}:`, error);
      throw error;
    }
  }
}
