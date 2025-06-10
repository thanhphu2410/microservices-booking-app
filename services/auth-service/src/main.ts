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
        package: 'auth',
        protoPath: join(__dirname, '../src/auth/proto/auth.proto'),
        url: '0.0.0.0:50051',
      },
  });

  app.useGlobalFilters(new RpcExceptionFilter());

  // Start all microservices
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Auth microservice is listening on 0.0.0.0:50051');
  console.log('HTTP server is running on port 3000');
}
bootstrap();
