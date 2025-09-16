import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BookingSagaService {
  private readonly logger = new Logger(BookingSagaService.name);

  constructor(private configService: ConfigService) {
  }
}