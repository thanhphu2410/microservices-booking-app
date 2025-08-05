import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeatsService } from './seats.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SeatStatus, SeatStatusEnum } from './entities/seat-status.entity';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);
  private readonly redisClient: Redis;

  constructor(
    private readonly seatsService: SeatsService,
    @InjectRepository(SeatStatus)
    private readonly seatStatusRepository: Repository<SeatStatus>,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getOrThrow();
  }

  /**
   * Clean up expired seat holds every 5 minutes
   * This job will find all seat holds that have expired and release them
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanupExpiredHolds() {
    this.logger.log('Starting scheduled cleanup of expired holds...');

    try {
      await this.seatsService.cleanupExpiredHolds();
      this.logger.log('Scheduled cleanup of expired holds completed successfully');
    } catch (error) {
      this.logger.error(`Error during scheduled cleanup of expired holds: ${error.message}`);
    }
  }

  /**
   * Enhanced cleanup job that runs every 10 minutes
   * This job handles more comprehensive cleanup tasks
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleEnhancedCleanup() {
    this.logger.log('Starting enhanced cleanup job...');

    try {
      // Clean up expired holds with more precise querying
      const now = new Date();
      const expiredHolds = await this.seatStatusRepository.find({
        where: {
          status: SeatStatusEnum.HOLD,
          holdExpiresAt: LessThan(now),
        },
        relations: ['seat'],
      });

      let cleanedCount = 0;
      for (const hold of expiredHolds) {
        try {
          await this.seatStatusRepository.update(
            { id: hold.id },
            {
              status: SeatStatusEnum.AVAILABLE,
              userId: null,
              holdExpiresAt: null,
              bookingId: null,
            }
          );

          // Release Redis lock
          const lockKey = `seat_lock:${hold.showtimeId}:${hold.seatId}`;
          await this.redisClient.del(lockKey);

          cleanedCount++;
        } catch (error) {
          this.logger.error(`Error cleaning up hold ${hold.id}: ${error.message}`);
        }
      }

      this.logger.log(`Enhanced cleanup completed: cleaned ${cleanedCount} expired holds`);
    } catch (error) {
      this.logger.error(`Error during enhanced cleanup: ${error.message}`);
    }
  }
}