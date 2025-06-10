import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RmqOptions, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'user_events_queue',
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