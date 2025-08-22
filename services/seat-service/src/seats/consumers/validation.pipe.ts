import { PipeTransform, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class EventValidationPipe implements PipeTransform {
  private readonly logger = new Logger(EventValidationPipe.name);

  constructor(private readonly dtoClass: any) {}

  async transform(value: any) {
    // Transform the plain object to DTO class instance
    const dtoInstance = plainToClass(this.dtoClass, value);

    // Validate the DTO
    const validationErrors = await validate(dtoInstance);

    if (validationErrors.length > 0) {
      this.logger.error(`Validation failed for ${this.dtoClass.name}:`, validationErrors);
      throw new BadRequestException(`Invalid data received: ${validationErrors.map(err => Object.values(err.constraints || {})).flat().join(', ')}`);
    }

    return dtoInstance;
  }
}
