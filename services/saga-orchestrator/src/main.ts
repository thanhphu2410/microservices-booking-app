import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create a hybrid application
  const app = await NestFactory.create(AppModule);

  // Add RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'saga_events_queue',
      queueOptions: {
        durable: true
      }
    }
  });

  // Start all microservices
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Saga orchestrator microservice is listening on 0.0.0.0:50056');
  console.log('RabbitMQ consumer is ready');
  console.log('HTTP server is running on port 3000');
}
bootstrap();
