import { Module } from '@nestjs/common';
import { SagaService } from './saga.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SagaInstance } from './entities/saga-instance.entity';
import { SagaStep } from './entities/saga-step.entity';
import { PaymentSuccessActionHandler } from './actions/payment-success.action.handler';
import { PaymentFailedActionHandler } from './actions/payment-failed.action.handler';
import { BookingConfirmedActionHandler } from './actions/booking-confirmed.action.handler';
import { BookingCreatedActionHandler } from './actions/booking-created.action.handler';
import { SeatConfirmedActionHandler } from './actions/seat-confirmed.action.handler';
import { SeatsHeldActionHandler } from './actions/seats-held.action.handler';
import { BookingBookedActionHandler } from './actions/booking-booked.action.handler';
import { IdempotencyRecordEntity } from './idempotency/idempotency-record.entity';
import { IdempotencyService } from './idempotency/idempotency.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([SagaInstance, SagaStep, IdempotencyRecordEntity]),
    ClientsModule.register([
      {
        name: 'BOOKING_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'booking_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'SEAT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'seat_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'user_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [],
  providers: [
    SagaService,
    IdempotencyService,
    PaymentSuccessActionHandler,
    PaymentFailedActionHandler,
    BookingConfirmedActionHandler,
    BookingCreatedActionHandler,
    SeatConfirmedActionHandler,
    SeatsHeldActionHandler,
    BookingBookedActionHandler,
  ],
  exports: [SagaService],
})
export class SagaModule {}