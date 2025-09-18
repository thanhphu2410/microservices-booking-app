import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SagaConsumer } from './consumers/saga.consumer';
import { SagaModule } from './saga/saga.module';
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
    SagaModule,
  ],
  controllers: [SagaConsumer],
  providers: [],
})
export class AppModule {}
