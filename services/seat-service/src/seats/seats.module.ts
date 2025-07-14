import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { Seat } from './entities/seat.entity';
import { SeatStatus } from './entities/seat-status.entity';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    TypeOrmModule.forFeature([Seat, SeatStatus]),
    ClientsModule.register([
      {
        name: 'SEAT_EVENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'seat_events',
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
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {}