import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { ClientProxy } from '@nestjs/microservices';
import { Redis } from 'ioredis';
import { Seat, SeatType } from './entities/seat.entity';
import { SeatStatus, SeatStatusEnum } from './entities/seat-status.entity';
import {
  GetSeatLayoutDto,
  GetSeatStatusDto,
  HoldSeatsDto,
  BookSeatsDto,
  ReleaseSeatsDto,
} from './dto';

@Injectable()
export class SeatsService {
  private readonly logger = new Logger(SeatsService.name);

  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    @InjectRepository(SeatStatus)
    private readonly seatStatusRepository: Repository<SeatStatus>,
    private readonly redisService: RedisService,
    @Inject('SEAT_EVENT_SERVICE') private readonly seatEventClient: ClientProxy,
  ) {
    this.redisClient = this.redisService.getOrThrow();
  }

  async getSeatLayout(data: GetSeatLayoutDto) {
    try {
      const seats = await this.seatRepository.find({
        where: { roomId: data.roomId },
        order: { row: 'ASC', column: 'ASC' },
      });

      if (seats.length === 0) {
        throw new Error('No seats found for this room');
      }

      return {
        seats: seats.map(seat => ({
          id: seat.id,
          row: seat.row,
          column: seat.column,
          type: seat.type,
          priceRatio: seat.priceRatio,
          description: seat.description,
        })),
        roomId: data.roomId,
      };
    } catch (error) {
      this.logger.error(`Error getting seat layout: ${error.message}`);
      throw error;
    }
  }

  async getSeatStatus(data: GetSeatStatusDto) {
    try {
      const seatStatuses = await this.seatStatusRepository.find({
        where: { showtimeId: data.showtimeId },
        relations: ['seat'],
      });

      return {
        seats: seatStatuses.map(status => ({
          seatId: status.seatId,
          row: status.seat.row,
          column: status.seat.column,
          type: status.seat.type,
          priceRatio: status.seat.priceRatio,
          status: status.status,
          userId: status.userId,
          bookingId: status.bookingId,
          holdExpiresAt: status.holdExpiresAt?.toISOString(),
        })),
        showtimeId: data.showtimeId,
      };
    } catch (error) {
      this.logger.error(`Error getting seat status: ${error.message}`);
      throw error;
    }
  }

  async holdSeats(data: HoldSeatsDto) {
    const heldSeatIds: string[] = [];
    const failedSeatIds: string[] = [];
    const holdDuration = data.holdDurationMinutes || 5; // Default 5 minutes

    for (const seatId of data.seatIds) {
      try {
        const lockKey = `seat_lock:${data.showtimeId}:${seatId}`;
        const lockValue = data.userId;
        const lockDuration = holdDuration * 60; // Convert to seconds

        // Try to acquire Redis lock
        const acquired = await this.redisClient.set(
          lockKey,
          lockValue,
          'EX',
          lockDuration,
          'NX'
        );

        if (acquired) {
          // Check if seat is available
          const seatStatus = await this.seatStatusRepository.findOne({
            where: {
              seatId,
              showtimeId: data.showtimeId,
            },
          });

          if (!seatStatus) {
            // Create new seat status as AVAILABLE
            await this.seatStatusRepository.save({
              seatId,
              showtimeId: data.showtimeId,
              status: SeatStatusEnum.HOLD,
              userId: data.userId,
              holdExpiresAt: new Date(Date.now() + holdDuration * 60 * 1000),
            });
          } else if (seatStatus.status === SeatStatusEnum.AVAILABLE) {
            // Update existing seat status to HOLD
            await this.seatStatusRepository.update(
              { id: seatStatus.id },
              {
                status: SeatStatusEnum.HOLD,
                userId: data.userId,
                holdExpiresAt: new Date(Date.now() + holdDuration * 60 * 1000),
              }
            );
          } else {
            // Seat is not available, release the lock
            await this.redisClient.del(lockKey);
            failedSeatIds.push(seatId);
            continue;
          }

          heldSeatIds.push(seatId);
        } else {
          failedSeatIds.push(seatId);
        }
      } catch (error) {
        this.logger.error(`Error holding seat ${seatId}: ${error.message}`);
        failedSeatIds.push(seatId);
      }
    }

    return {
      success: heldSeatIds.length > 0,
      heldSeatIds,
      failedSeatIds,
      message: heldSeatIds.length > 0
        ? `Successfully held ${heldSeatIds.length} seats`
        : 'Failed to hold any seats',
    };
  }

  async bookSeats(data: BookSeatsDto) {
    const bookedSeatIds: string[] = [];
    const failedSeatIds: string[] = [];

    for (const seatId of data.seatIds) {
      try {
        const lockKey = `seat_lock:${data.showtimeId}:${seatId}`;

        // Check if user holds the seat
        const lockValue = await this.redisClient.get(lockKey);

        if (lockValue !== data.userId) {
          failedSeatIds.push(seatId);
          continue;
        }

        // Update seat status to BOOKED
        await this.seatStatusRepository.update(
          {
            seatId,
            showtimeId: data.showtimeId,
            userId: data.userId,
          },
          {
            status: SeatStatusEnum.BOOKED,
            bookingId: data.bookingId,
            holdExpiresAt: null,
          }
        );

        // Release the Redis lock
        await this.redisClient.del(lockKey);

        bookedSeatIds.push(seatId);
      } catch (error) {
        this.logger.error(`Error booking seat ${seatId}: ${error.message}`);
        failedSeatIds.push(seatId);
      }
    }

    // Emit booking event
    if (bookedSeatIds.length > 0) {
      this.seatEventClient.emit('seats_booked', {
        showtimeId: data.showtimeId,
        seatIds: bookedSeatIds,
        userId: data.userId,
        bookingId: data.bookingId,
      });
    }

    return {
      success: bookedSeatIds.length > 0,
      bookedSeatIds,
      failedSeatIds,
      message: bookedSeatIds.length > 0
        ? `Successfully booked ${bookedSeatIds.length} seats`
        : 'Failed to book any seats',
    };
  }

  async releaseSeats(data: ReleaseSeatsDto) {
    const releasedSeatIds: string[] = [];
    const failedSeatIds: string[] = [];

    for (const seatId of data.seatIds) {
      try {
        const lockKey = `seat_lock:${data.showtimeId}:${seatId}`;

        // Check if user holds the seat
        const lockValue = await this.redisClient.get(lockKey);

        if (lockValue !== data.userId) {
          failedSeatIds.push(seatId);
          continue;
        }

        // Update seat status back to AVAILABLE
        await this.seatStatusRepository.update(
          {
            seatId,
            showtimeId: data.showtimeId,
            userId: data.userId,
          },
          {
            status: SeatStatusEnum.AVAILABLE,
            userId: null,
            holdExpiresAt: null,
          }
        );

        // Release the Redis lock
        await this.redisClient.del(lockKey);

        releasedSeatIds.push(seatId);
      } catch (error) {
        this.logger.error(`Error releasing seat ${seatId}: ${error.message}`);
        failedSeatIds.push(seatId);
      }
    }

    return {
      success: releasedSeatIds.length > 0,
      releasedSeatIds,
      failedSeatIds,
      message: releasedSeatIds.length > 0
        ? `Successfully released ${releasedSeatIds.length} seats`
        : 'Failed to release any seats',
    };
  }

  // Cleanup expired holds (should be called by a scheduled job)
  async cleanupExpiredHolds() {
    try {
      const expiredHolds = await this.seatStatusRepository.find({
        where: {
          status: SeatStatusEnum.HOLD,
          holdExpiresAt: new Date(),
        },
      });

      for (const hold of expiredHolds) {
        await this.seatStatusRepository.update(
          { id: hold.id },
          {
            status: SeatStatusEnum.AVAILABLE,
            userId: null,
            holdExpiresAt: null,
          }
        );

        // Release Redis lock
        const lockKey = `seat_lock:${hold.showtimeId}:${hold.seatId}`;
        await this.redisClient.del(lockKey);
      }

      this.logger.log(`Cleaned up ${expiredHolds.length} expired holds`);
    } catch (error) {
      this.logger.error(`Error cleaning up expired holds: ${error.message}`);
    }
  }
}