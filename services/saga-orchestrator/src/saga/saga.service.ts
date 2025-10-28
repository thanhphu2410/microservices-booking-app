import { Injectable, Logger } from '@nestjs/common';
import { PaymentEvent, PaymentSuccessEvent, PaymentFailedEvent } from './interfaces/payment-events.interface';
import { BookingConfirmedEvent, BookingBookedEvent, BookingFailedEvent, BookingCreatedEvent } from './interfaces/booking-events.interface';
import { SeatConfirmedEvent, SeatsHeldEvent } from './interfaces/seat-events.interface';
import { BookingBookedActionHandler } from './actions/booking-booked.action.handler';
import { PaymentSuccessActionHandler } from './actions/payment-success.action.handler';
import { PaymentFailedActionHandler } from './actions/payment-failed.action.handler';
import { BookingConfirmedActionHandler } from './actions/booking-confirmed.action.handler';
import { BookingCreatedActionHandler } from './actions/booking-created.action.handler';
import { SeatConfirmedActionHandler } from './actions/seat-confirmed.action.handler';
import { SeatsHeldActionHandler } from './actions/seats-held.action.handler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SagaInstance, SagaStatus } from './entities/saga-instance.entity';
import { SagaStep, StepStatus } from './entities/saga-step.entity';

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);

  constructor(
    private readonly paymentSuccessHandler: PaymentSuccessActionHandler,
    private readonly paymentFailedHandler: PaymentFailedActionHandler,
    private readonly bookingConfirmedHandler: BookingConfirmedActionHandler,
    private readonly bookingCreatedHandler: BookingCreatedActionHandler,
    private readonly seatConfirmedHandler: SeatConfirmedActionHandler,
    private readonly seatsHeldHandler: SeatsHeldActionHandler,
    private readonly bookingBookedHandler: BookingBookedActionHandler,
    @InjectRepository(SagaInstance)
    private readonly sagaInstanceRepository: Repository<SagaInstance>,
    @InjectRepository(SagaStep)
    private readonly sagaStepRepository: Repository<SagaStep>,
  ) {}

  /**
   * Handle payment events by calling appropriate action handler
   * @param event - Payment event
   */
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    this.logger.log(`Handling payment event: ${event.eventType} for booking ${event.bookingId}`);

    switch (event.eventType) {
      case 'PAYMENT_SUCCESS':
        await this.paymentSuccessHandler.handle(event as PaymentSuccessEvent);
        break;
      case 'PAYMENT_FAILED':
        await this.paymentFailedHandler.handle(event as PaymentFailedEvent);
        break;
      default:
        this.logger.warn(`Unknown payment event type: ${event.eventType}`);
    }
  }

  /**
   * Handle booking created events by calling booking created handler
   * @param event - Booking created event
   */
  async handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
    this.logger.log(`Handling booking created event for booking ${event.bookingId} in saga ${event.sagaId}`);
    await this.bookingCreatedHandler.handle(event);
  }

  /**
   * Handle booking confirmed events by calling booking confirmed handler
   * @param event - Booking confirmed event
   */
  async handleBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    this.logger.log(`Handling booking confirmed event for booking ${event.bookingId} in saga ${event.sagaId}`);
    await this.bookingConfirmedHandler.handle(event);
  }

  /**
   * Handle seat confirmed events by calling seat confirmed handler
   * @param event - Seat confirmed event
   */
  async handleSeatConfirmed(event: SeatConfirmedEvent): Promise<void> {
    this.logger.log(`Handling seat confirmed event for booking ${event.bookingId} in saga ${event.sagaId}`);
    await this.seatConfirmedHandler.handle(event);
  }

  async handleSeatsHeld(event: SeatsHeldEvent): Promise<void> {
    this.logger.log(`Handling seats held event for showtime ${event.showtimeId} by user ${event.userId}`);
    await this.seatsHeldHandler.handle(event);
  }

  async handleBookingBooked(event: BookingBookedEvent): Promise<void> {
    this.logger.log(`Handling booking booked event for booking ${event.bookingId} in saga ${event.sagaId}`);
    await this.bookingBookedHandler.handle(event);
  }

  /**
   * Handle booking failed events by marking saga as failed
   * @param event - Booking failed event
   */
  async handleBookingFailed(event: BookingFailedEvent): Promise<void> {
    this.logger.log(`Handling booking failed event for booking ${event.bookingId}`);

    try {
      // Try to find saga by booking ID
      let saga = await this.sagaInstanceRepository
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.steps', 'steps')
        .where("s.payload ->> 'bookingId' = :bookingId", { bookingId: event.bookingId })
        .orderBy('steps.step_order', 'ASC')
        .getOne();

      // If not found by booking ID, try saga ID if provided
      if (!saga && event.sagaId) {
        saga = await this.sagaInstanceRepository.findOne({
          where: { id: event.sagaId },
          relations: ['steps'],
          order: { steps: { step_order: 'ASC' } },
        });
      }

      if (!saga) {
        this.logger.warn(`No saga found for booking ${event.bookingId}`);
        return;
      }

      // Mark all active steps as FAILED
      const activeSteps = saga.steps.filter(step => step.status === StepStatus.PENDING);
      for (const step of activeSteps) {
        await this.sagaStepRepository.update(step.id, {
          status: StepStatus.FAILED,
          finished_at: new Date(),
          error_message: event.reason || 'Booking failed',
        });
      }

      // Update saga status to FAILED
      await this.sagaInstanceRepository.update(saga.id, {
        status: SagaStatus.FAILED,
      });

      this.logger.log(`Marked saga ${saga.id} as FAILED for booking ${event.bookingId}`);

    } catch (error) {
      this.logger.error(`Failed to process booking failed event for booking ${event.bookingId}:`, error);
      throw error;
    }
  }
}