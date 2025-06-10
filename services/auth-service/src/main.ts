import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'auth',
        protoPath: join(__dirname, '../src/auth/proto/auth.proto'),
        url: '0.0.0.0:50051',
      },
    },
  );

  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen();
  console.log('Auth microservice is listening on 0.0.0.0:50051');
}
bootstrap();
