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
    NotificationModule,
  ],
  controllers: [UserConsumer],
  providers: [],
})
export class AppModule {}
