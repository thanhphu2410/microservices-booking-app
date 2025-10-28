import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { BaseActionHandler } from './base-action.handler';
import { PaymentFailedEvent } from '../interfaces/payment-events.interface';
import { SagaInstance, SagaStatus } from '../entities/saga-instance.entity';
import { SagaStep, StepStatus } from '../entities/saga-step.entity';

@Injectable()
export class PaymentFailedActionHandler extends BaseActionHandler {
  constructor(
    @InjectRepository(SagaInstance)
    sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    sagaStepRepository: Repository<SagaStep>,
    @Inject('BOOKING_SERVICE')
    private readonly bookingClient: ClientProxy,
    @Inject('SEAT_SERVICE')
    private readonly seatClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {
    super(sagaInstanceRepository, sagaStepRepository);
  }

  async handle(event: PaymentFailedEvent): Promise<void> {
    this.logger.log(`Processing payment failure for booking ${event.bookingId}`);

    try {
      // Get the existing saga instead of creating a new one
      const saga = await this.getSagaByBookingId(event.bookingId);

      if (!saga) {
        this.logger.error(`No saga found for booking ${event.bookingId}`);
        return;
      }

      // Update saga status to FAILED when compensation starts
      await this.updateSagaStatus(saga.id, SagaStatus.FAILED, saga.current_step);

      await this.executeCompensationSteps(saga.id, saga, event);

      this.logger.log(`Payment failure compensation completed for booking ${event.bookingId} in saga ${saga.id}`);

    } catch (error) {
      this.logger.error(`Failed to process payment failure for booking ${event.bookingId}:`, error);
      throw error;
    }
  }

  private async executeCompensationSteps(sagaId: string, saga: SagaInstance, event: PaymentFailedEvent): Promise<void> {
    try {
      // Step 1: Cancel Booking
      const cancelBookingStep = await this.createSagaStep(
        sagaId,
        'cancel_booking',
        {
          bookingId: event.bookingId,
          reason: event.reason,
        }
      );

      try {
        await this.cancelBooking(event.bookingId);
        await this.updateSagaStep(
          cancelBookingStep.id,
          StepStatus.SUCCESS,
          {
            message: 'Booking cancelled successfully',
            bookingId: event.bookingId,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to cancel booking ${event.bookingId}:`, error);
        await this.updateSagaStep(
          cancelBookingStep.id,
          StepStatus.FAILED,
          null,
          `Failed to cancel booking: ${error.message}`
        );
      }

      // Step 2: Release Seats
      const releaseSeatsStep = await this.createSagaStep(
        sagaId,
        'release_seats',
        {
          bookingId: event.bookingId,
          seatIds: saga.payload?.seatIds || [],
          showtimeId: saga.payload?.showtimeId,
        }
      );

      try {
        await this.releaseSeats(saga);
        await this.updateSagaStep(
          releaseSeatsStep.id,
          StepStatus.SUCCESS,
          {
            message: 'Seats released successfully',
            bookingId: event.bookingId,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to release seats for booking ${event.bookingId}:`, error);
        await this.updateSagaStep(
          releaseSeatsStep.id,
          StepStatus.FAILED,
          null,
          `Failed to release seats: ${error.message}`
        );
      }

      // Step 3: Notify User
      const notifyUserStep = await this.createSagaStep(
        sagaId,
        'notify_user',
        {
          bookingId: event.bookingId,
          reason: event.reason,
        }
      );

      try {
        await this.sendFailureNotification(saga, event.reason);
        await this.updateSagaStep(
          notifyUserStep.id,
          StepStatus.SUCCESS,
          {
            message: 'User notification sent successfully',
            bookingId: event.bookingId,
          }
        );
      } catch (error) {
        this.logger.error(`Failed to send notification for booking ${event.bookingId}:`, error);
        await this.updateSagaStep(
          notifyUserStep.id,
          StepStatus.FAILED,
          null,
          `Failed to send notification: ${error.message}`
        );
      }

      // Mark saga as completed (compensation finished)
      await this.updateSagaStatus(sagaId, SagaStatus.COMPLETED, notifyUserStep.step_order);

      this.logger.log(`All compensation steps completed for saga ${sagaId}`);

    } catch (error) {
      this.logger.error(`Failed to execute compensation steps for saga ${sagaId}:`, error);
      throw error;
    }
  }

  private async cancelBooking(bookingId: string): Promise<void> {
    this.logger.log(`Cancelling booking ${bookingId}`);

    await this.bookingClient.emit('cancel_booking', {
      bookingId,
    }).toPromise();

    this.logger.log(`Emitted cancel_booking event for booking ${bookingId}`);
  }

  private async releaseSeats(saga: SagaInstance): Promise<void> {
    const seatIds = saga.payload?.seatIds || [];
    const showtimeId = saga.payload?.showtimeId;
    const userId = saga.payload?.userId;

    if (!seatIds || seatIds.length === 0) {
      this.logger.warn(`No seat IDs found in saga payload for booking ${saga.payload?.bookingId}`);
      return;
    }

    this.logger.log(`Releasing seats ${seatIds.join(', ')} for booking ${saga.payload?.bookingId}`);

    await this.seatClient.emit('booking_canceled', {
      showtimeId,
      seatIds,
      userId,
      bookingId: saga.payload?.bookingId,
    }).toPromise();

    this.logger.log(`Emitted booking_canceled event to release seats for booking ${saga.payload?.bookingId}`);
  }

  private async sendFailureNotification(saga: SagaInstance, reason?: string): Promise<void> {
    const userId = saga.payload?.userId;
    const bookingId = saga.payload?.bookingId;

    if (!userId || !bookingId) {
      this.logger.warn(`Missing userId or bookingId in saga payload for notification`);
      return;
    }

    this.logger.log(`Sending failure notification for booking ${bookingId}`);

    await this.notificationClient.emit('booking_canceled', {
      userId,
      bookingId,
      reason: reason || 'Payment failed',
    }).toPromise();

    this.logger.log(`Emitted booking_canceled notification event for booking ${bookingId}`);
  }
}
