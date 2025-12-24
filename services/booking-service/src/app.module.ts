import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingsModule } from './bookings/booking.module';
import { Booking } from './bookings/entities/booking.entity';
import { BookingItem } from './bookings/entities/booking-item.entity';
import { IdempotencyRecordEntity } from './bookings/idempotency/idempotency-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [Booking, BookingItem, IdempotencyRecordEntity],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    BookingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}