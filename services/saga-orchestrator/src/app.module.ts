import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BookingSagaConsumer } from './consumers/booking-saga.consumer';
import { BookingSagaModule } from './booking-saga/booking-saga.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    BookingSagaModule,
  ],
  controllers: [BookingSagaConsumer],
  providers: [],
})
export class AppModule {}
