import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BaseActionHandler } from './base-action.handler';
import { BookingConfirmedEvent } from '../interfaces/booking-events.interface';
import { BookingConfirmedToSeatEvent } from '../interfaces/seat-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';

@Injectable()
export class BookingConfirmedActionHandler extends BaseActionHandler {
  constructor(
    @InjectRepository(SagaInstance)
    sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    sagaStepRepository: Repository<SagaStep>,
    @Inject('SEAT_SERVICE')
    private readonly seatClient: ClientProxy,
  ) {
    super(sagaInstanceRepository, sagaStepRepository);
  }

  async handle(event: BookingConfirmedEvent): Promise<void> {
    const saga = await this.getSagaById(event.sagaId);
    if (!saga) return;

    const confirmBookingStep = saga.steps.find(step => step.step_name === 'confirm_booking');
    if (!confirmBookingStep) return;

    // Handle failure case
    if (!event.success) {
      this.logger.error(`Booking confirmation failed for booking ${event.bookingId}: ${event.message}`);

      await this.updateSagaStep(
        confirmBookingStep.id,
        StepStatus.FAILED,
        null,
        event.message || 'Booking confirmation failed'
      );

      await this.updateSagaStatus(saga.id, SagaStatus.FAILED, confirmBookingStep.step_order);
      return;
    }

    await this.updateSagaStep(
      confirmBookingStep.id,
      StepStatus.SUCCESS,
      {
        message: event.message || 'Booking confirmed successfully',
        bookingId: event.bookingId,
        confirmedAt: new Date().toISOString(),
      }
    );

    const seatConfirmationStep = await this.createSagaStep(
      saga.id,
      'seat_confirmation',
      {
        bookingId: event.bookingId,
        sagaId: event.sagaId,
        message: 'Confirming seats with seat service',
      }
    );

    const seatEvent: BookingConfirmedToSeatEvent = {
      eventType: 'BOOKING_CONFIRMED',
      bookingId: event.bookingId,
      sagaId: event.sagaId,
      seatIds: event.seatIds || saga?.payload?.seatIds || [],
      showtimeId: event.showtimeId || saga?.payload?.showtimeId || '',
      userId: event.userId || saga?.payload?.userId || '',
      timestamp: new Date().toISOString(),
    };

    await this.seatClient.emit('booking_confirmed', seatEvent).toPromise();

    await this.updateSagaStatus(saga.id, SagaStatus.IN_PROGRESS, seatConfirmationStep.step_order);
  }
}
