import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SagaConsumer } from './consumers/saga.consumer';
import { SagaModule } from './saga/saga.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SagaInstance } from './saga/entities/saga-instance.entity';
import { SagaStep } from './saga/entities/saga-step.entity';
import { IdempotencyRecordEntity } from './saga/idempotency/idempotency-record.entity';

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
      entities: [SagaInstance, SagaStep, IdempotencyRecordEntity],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    SagaModule,
  ],
  controllers: [SagaConsumer],
  providers: [],
})
export class AppModule {}
