import { Module } from '@nestjs/common';
import { SagaService } from './saga.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [SagaService],
  exports: [SagaService],
})
export class SagaModule {}