import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { AuthModule } from '../auth/auth.module';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SEAT_SERVICE',
        transport: Transport.GRPC,
        options: {
          url: process.env.SEAT_SERVICE_URL,
          package: 'seat',
          protoPath: join(__dirname, '../../src/proto/seat.proto'),
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [SeatsController],
  providers: [SeatsService],
})
export class SeatsModule {}