import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SeatsModule } from './seats/seats.module';
import { Seat } from './seats/entities/seat.entity';
import { SeatStatus } from './seats/entities/seat-status.entity';
import { IdempotencyRecordEntity } from './seats/idempotency/idempotency-record.entity';

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
      entities: [Seat, SeatStatus, IdempotencyRecordEntity],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    SeatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}