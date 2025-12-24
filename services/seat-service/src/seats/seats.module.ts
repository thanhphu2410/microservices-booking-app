import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { Seat } from './entities/seat.entity';
import { SeatStatus } from './entities/seat-status.entity';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { SeatConsumer } from './consumers/seat.consumer';
import { IdempotencyRecordEntity } from './idempotency/idempotency-record.entity';
import { IdempotencyService } from './idempotency/idempotency.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, SeatStatus, IdempotencyRecordEntity]),
    ClientsModule.register([
      {
        name: 'SEAT_EVENT_SERVICE',
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
        name: 'BOOKING_EVENT_SERVICE',
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
        name: 'SAGA_ORCHESTRATOR',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'saga_events_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    RedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL,
      },
    }),
  ],
  controllers: [SeatsController, SeatConsumer],
  providers: [SeatsService, ScheduledJobsService, IdempotencyService],
  exports: [SeatsService],
})
export class SeatsModule {}