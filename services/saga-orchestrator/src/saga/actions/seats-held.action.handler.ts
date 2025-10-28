import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BaseActionHandler } from './base-action.handler';
import { SeatsHeldEvent } from '../interfaces/seat-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';

@Injectable()
export class SeatsHeldActionHandler extends BaseActionHandler {
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

  async handle(event: SeatsHeldEvent): Promise<void> {
    const seatIds = event.seats.map(seat => seat.id);

    const sagaPayload = {
      bookingId: event.bookingId || null,
      seats: event.seats,
      seatIds: seatIds,
      showtimeId: event.showtimeId,
      userId: event.userId,
      holdExpiresAt: event.holdExpiresAt,
      timestamp: event.timestamp,
    };

    const saga = await this.createSaga('BookingSaga', sagaPayload);

    const holdStep = await this.createSagaStep(
      saga.id,
      'saga_seats_held',
      {
        seats: event.seats,
        seatIds: seatIds,
        showtimeId: event.showtimeId,
        userId: event.userId,
        holdExpiresAt: event.holdExpiresAt,
      }
    );

    await this.updateSagaStep(
      holdStep.id,
      StepStatus.SUCCESS,
      {
        message: 'Seats held successfully',
        seatIds: seatIds,
      }
    );

    const createBookingStep = await this.createSagaStep(
      saga.id,
      'create_booking',
      {
        userId: event.userId,
        seats: event.seats,
        seatIds: seatIds,
        showtimeId: event.showtimeId,
      }
    );

    await this.bookingClient.emit('create_booking', {
      userId: event.userId,
      showtimeId: event.showtimeId,
      sagaId: saga.id,
      seats: event.seats,
    }).toPromise();

    await this.updateSagaStatus(saga.id, SagaStatus.IN_PROGRESS, createBookingStep.step_order);
  }
}


