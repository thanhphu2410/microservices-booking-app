import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  // Create a hybrid application
  const app = await NestFactory.create(AppModule);

  // Add gRPC microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'notification',
      protoPath: join(__dirname, '../src/notification/proto/notification.proto'),
      url: '0.0.0.0:50052',
    },
  });

  // Add RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'user_events_queue',
      queueOptions: {
        durable: true
      }
    }
  });

  app.useGlobalFilters(new RpcExceptionFilter());

  // Start all microservices
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Notification microservice is listening on 0.0.0.0:50052');
  console.log('RabbitMQ consumer is ready');
  console.log('HTTP server is running on port 3000');
}
bootstrap();
