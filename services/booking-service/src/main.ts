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
      package: 'booking',
      protoPath: join(__dirname, '../src/bookings/proto/booking.proto'),
      url: '0.0.0.0:50055',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'booking_events_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  app.useGlobalFilters(new RpcExceptionFilter());

  // Start all microservices
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Booking microservice is listening on 0.0.0.0:50055');
  console.log('HTTP server is running on port 3000');
}
bootstrap();

// TODO: Setup gRPC microservice bootstrap here, similar to auth-service
