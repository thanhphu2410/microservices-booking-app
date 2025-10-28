import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseActionHandler } from './base-action.handler';
import { SeatConfirmedEvent } from '../interfaces/seat-events.interface';
import { SeatsBookedEvent } from '../interfaces/booking-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class SeatConfirmedActionHandler extends BaseActionHandler {
  constructor(
    @InjectRepository(SagaInstance)
    sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    sagaStepRepository: Repository<SagaStep>,
    @Inject('BOOKING_SERVICE')
    private readonly bookingClient: ClientProxy,
  ) {
    super(sagaInstanceRepository, sagaStepRepository);
  }

  async handle(event: SeatConfirmedEvent): Promise<void> {
    const saga = await this.getSagaById(event.sagaId);
    if (!saga) return;

    const seatConfirmationStep = saga.steps.find(step => step.step_name === 'seat_confirmation');
    if (!seatConfirmationStep) return;

    // Handle failure case
    if (!event.success) {
      this.logger.error(`Seat confirmation failed for booking ${event.bookingId}: ${event.message}`);

      await this.updateSagaStep(
        seatConfirmationStep.id,
        StepStatus.FAILED,
        null,
        event.message || 'Seat confirmation failed'
      );

      await this.updateSagaStatus(saga.id, SagaStatus.FAILED, seatConfirmationStep.step_order);
      return;
    }

    await this.updateSagaStep(
      seatConfirmationStep.id,
      StepStatus.SUCCESS,
      {
        message: event.message || 'Seats confirmed successfully',
        bookingId: event.bookingId,
        seatIds: event.seatIds,
        confirmedAt: new Date().toISOString(),
      }
    );

    const seatsBookedStep = await this.createSagaStep(
      saga.id,
      'seats_booked',
      {
        bookingId: event.bookingId,
        sagaId: event.sagaId,
        seatIds: event.seatIds,
        showtimeId: saga?.payload?.showtimeId,
      }
    );

    const seatsBookedEvent: SeatsBookedEvent = {
      eventType: 'SEATS_BOOKED',
      bookingId: event.bookingId,
      sagaId: event.sagaId,
      seatIds: event.seatIds,
      showtimeId: saga?.payload?.showtimeId,
      userId: saga?.payload?.userId,
      timestamp: new Date().toISOString(),
    };

    await this.bookingClient.emit('seats_booked', seatsBookedEvent).toPromise();

    await this.updateSagaStatus(saga.id, SagaStatus.IN_PROGRESS, seatsBookedStep.step_order);
  }
}
