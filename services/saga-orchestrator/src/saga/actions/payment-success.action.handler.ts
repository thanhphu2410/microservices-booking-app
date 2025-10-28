import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BaseActionHandler } from './base-action.handler';
import { PaymentSuccessEvent } from '../interfaces/payment-events.interface';
import { ConfirmBookingEvent } from '../interfaces/booking-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';

@Injectable()
export class PaymentSuccessActionHandler extends BaseActionHandler {
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

  async handle(event: PaymentSuccessEvent): Promise<void> {
    try {
      const saga = await this.getSagaByBookingId(event.bookingId);
      if (!saga) {
        this.logger.warn(`No saga found for booking ${event.bookingId}; skipping payment success handling`);
        return;
      }

      const paymentSucceededStep = await this.createSagaStep(
        saga.id,
        'payment_succeeded',
        {
          transactionId: event.transactionId,
          amount: event.amount,
          timestamp: event.timestamp,
        }
      );

      await this.updateSagaStep(
        paymentSucceededStep.id,
        StepStatus.SUCCESS,
        {
          message: 'Payment processed successfully',
          transactionId: event.transactionId,
        }
      );

      await this.updateSagaStatus(saga.id, SagaStatus.IN_PROGRESS, paymentSucceededStep.step_order);

      const confirmBookingStep = await this.createSagaStep(
        saga.id,
        'confirm_booking',
        {
          bookingId: event.bookingId,
          transactionId: event.transactionId,
          amount: event.amount,
          userId: event.userId,
        }
      );

      await this.publishConfirmBookingEvent(
        saga.id,
        event.bookingId,
        event.transactionId,
        event.amount,
        event.userId,
      );

      await this.updateSagaStatus(saga.id, SagaStatus.IN_PROGRESS, confirmBookingStep.step_order);

      this.logger.log(`Successfully fired confirm_booking event for booking ${event.bookingId} in saga ${saga.id}`);

    } catch (error) {
      this.logger.error(`Failed to process payment success for booking ${event.bookingId}:`, error);
      throw error;
    }
  }

  private async publishConfirmBookingEvent(
    sagaId: string,
    bookingId: string,
    transactionId: string,
    amount: number,
    userId?: string,
  ): Promise<void> {
    const confirmBookingEvent: ConfirmBookingEvent = {
      eventType: 'CONFIRM_BOOKING',
      bookingId,
      sagaId,
      transactionId,
      amount,
      userId,
      timestamp: new Date().toISOString(),
    };

    await this.bookingClient.emit('confirm_booking', confirmBookingEvent).toPromise();
  }
}
