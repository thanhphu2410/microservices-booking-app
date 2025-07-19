import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserConsumer } from './consumers/user.consumer';
import { NotificationModule } from './notification/notification.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'user_events_queue',
          queueOptions: {
            durable: true
          }
        },
      },
    ]),
    NotificationModule,
  ],
  controllers: [UserConsumer],
  providers: [],
})
export class AppModule {}
