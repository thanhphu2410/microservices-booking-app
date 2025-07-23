import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BookingsController } from './booking.controller';
import { BookingsService } from './booking.service';
import { AuthModule } from '../auth/auth.module';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BOOKING_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: 'booking-service:50055',
          package: 'booking',
          protoPath: join(__dirname, '../../src/proto/booking.proto'),
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}