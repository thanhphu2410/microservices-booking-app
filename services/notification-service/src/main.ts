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
        package: 'notification',
        protoPath: join(__dirname, '../src/notification/proto/notification.proto'),
        url: '0.0.0.0:50052',
      },
    },
  );

  app.useGlobalFilters(new RpcExceptionFilter());

  await app.listen();
  console.log('Notification microservice is listening on 0.0.0.0:50052');
}
bootstrap();
