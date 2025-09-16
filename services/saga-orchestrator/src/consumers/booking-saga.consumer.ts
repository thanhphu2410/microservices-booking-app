import { Controller, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BookingSagaService } from '../booking-saga/booking-saga.service';

interface UserRegisteredMessage {
  userId: string;
  email: string;
  fullName: string;
  event: string;
  timestamp: string;
}

@Controller()
export class BookingSagaConsumer {
  private readonly logger = new Logger(BookingSagaConsumer.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly bookingSagaService: BookingSagaService,
  ) {}
}