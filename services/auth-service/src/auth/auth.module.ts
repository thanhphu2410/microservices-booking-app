import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key', // In production, use environment variable
      signOptions: { expiresIn: '1d' },
    }),
    RabbitMQModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}