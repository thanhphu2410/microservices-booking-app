import { Module } from '@nestjs/common';
import { BookingSagaService } from './booking-saga.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [BookingSagaService],
  exports: [BookingSagaService],
})
export class BookingSagaModule {}