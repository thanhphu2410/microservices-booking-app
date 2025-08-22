import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsController } from './booking.controller';
import { BookingsService } from './booking.service';
import { BookingTimeoutService } from './booking-timeout.service';
import { Booking } from './entities/booking.entity';
import { BookingItem } from './entities/booking-item.entity';
import { BookingConsumer } from './consumers/booking.consumer';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Booking, BookingItem]),
    ClientsModule.register([
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
    ]),
    RedisModule.forRoot({
      config: {
        url: process.env.REDIS_URL,
      },
    }),
  ],
  controllers: [BookingsController, BookingConsumer],
  providers: [BookingsService, BookingTimeoutService],
  exports: [BookingsService],
})
export class BookingsModule {}