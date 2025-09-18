import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'SAGA_ORCHESTRATOR',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'saga_orchestrator_queue',
          queueOptions: {
            durable: true
          }
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
