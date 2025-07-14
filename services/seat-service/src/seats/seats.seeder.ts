import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat, SeatType } from './entities/seat.entity';

@Injectable()
export class SeatsSeeder {
  private readonly logger = new Logger(SeatsSeeder.name);

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async seed() {
    try {
      // Create seats for room 1 (10 rows x 10 columns)
      const seats1 = [];
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const seatType = row <= 2 ? SeatType.VIP : SeatType.NORMAL;
          const priceRatio = row <= 2 ? 1.5 : 1.0;

          seats1.push({
            row: String.fromCharCode(64 + row), // A, B, C, etc.
            column: col,
            type: seatType,
            priceRatio,
            description: `${String.fromCharCode(64 + row)}${col}`,
            roomId: 'room-1', // Hardcoded room ID
          });
        }
      }

      // Create seats for room 2 (8 rows x 10 columns)
      const seats2 = [];
      for (let row = 1; row <= 8; row++) {
        for (let col = 1; col <= 10; col++) {
          const seatType = row <= 2 ? SeatType.PREMIUM : SeatType.NORMAL;
          const priceRatio = row <= 2 ? 2.0 : 1.0;

          seats2.push({
            row: String.fromCharCode(64 + row), // A, B, C, etc.
            column: col,
            type: seatType,
            priceRatio,
            description: `${String.fromCharCode(64 + row)}${col}`,
            roomId: 'room-2', // Hardcoded room ID
          });
        }
      }

      // Save all seats
      await this.seatRepository.save([...seats1, ...seats2]);

      this.logger.log('Seats seeded successfully');
      this.logger.log(`Created ${seats1.length} seats for room 1`);
      this.logger.log(`Created ${seats2.length} seats for room 2`);
    } catch (error) {
      this.logger.error(`Error seeding seats: ${error.message}`);
      throw error;
    }
  }
}