import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseActionHandler } from './base-action.handler';
import { BookingBookedEvent, BookingCompleteEvent } from '../interfaces/booking-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class BookingBookedActionHandler extends BaseActionHandler {
  constructor(
    @InjectRepository(SagaInstance)
    sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    sagaStepRepository: Repository<SagaStep>,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {
    super(sagaInstanceRepository, sagaStepRepository);
  }

  async handle(event: BookingBookedEvent): Promise<void> {
    const saga = await this.getSagaById(event.sagaId);
    if (!saga) return;

    const seatsBookedStep = saga.steps.find(step => step.step_name === 'seats_booked');
    if (!seatsBookedStep) return;

    await this.updateSagaStep(
      seatsBookedStep.id,
      StepStatus.SUCCESS,
      {
        message: 'Booking marked as booked by booking-service',
        bookingId: event.bookingId,
        finalisedAt: new Date().toISOString(),
      }
    );

    // Create booking complete step
    const bookingCompleteStep = await this.createSagaStep(
      saga.id,
      'booking_complete',
      {
        bookingId: event.bookingId,
        sagaId: event.sagaId,
        seatIds: event.seatIds || [],
        showtimeId: event.showtimeId || saga?.payload?.showtimeId,
        userId: event.userId || saga?.payload?.userId,
      }
    );

    // Emit booking complete event to notification service
    const bookingCompleteEvent: BookingCompleteEvent = {
      eventType: 'BOOKING_COMPLETE',
      bookingId: event.bookingId,
      sagaId: event.sagaId,
      userId: event.userId || saga?.payload?.userId,
      seatIds: event.seatIds || [],
      showtimeId: event.showtimeId || saga?.payload?.showtimeId,
      timestamp: new Date().toISOString(),
    };

    await this.notificationClient.emit('booking_complete', bookingCompleteEvent).toPromise();

    // update saga step to success
    await this.updateSagaStep(
      bookingCompleteStep.id,
      StepStatus.SUCCESS,
      {
        message: 'Booking complete step updated successfully',
      }
    );

    // Update saga status to completed
    await this.updateSagaStatus(saga.id, SagaStatus.COMPLETED, bookingCompleteStep.step_order);

    this.logger.log(`Booking ${event.bookingId} completed successfully. Notification sent.`);
  }
}


