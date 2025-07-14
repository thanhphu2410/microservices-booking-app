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
      package: 'seat',
      protoPath: join(__dirname, '../src/seats/proto/seat.proto'),
      url: '0.0.0.0:50054',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'seat_sync_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalFilters(new RpcExceptionFilter());

  // Start all microservices
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Seat microservice is listening on 0.0.0.0:50054');
  console.log('HTTP server is running on port 3000');
}
bootstrap();

// TODO: Setup gRPC microservice bootstrap here, similar to auth-service
