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
  GetSeatLayoutResponseDto,
  GetSeatStatusResponseDto,
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
    @Inject('BOOKING_EVENT_SERVICE') private readonly bookingEventClient: ClientProxy,
  ) {
    this.redisClient = this.redisService.getOrThrow();
  }

  async getSeatLayout(data: GetSeatLayoutDto): Promise<GetSeatLayoutResponseDto> {
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
          column: seat.column.toString(),
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

  async getSeatStatus(data: GetSeatStatusDto): Promise<GetSeatStatusResponseDto> {
    try {
      const seatStatuses = await this.seatStatusRepository.find({
        where: { showtimeId: data.showtimeId },
        relations: ['seat'],
      });

      return {
        seats: seatStatuses.map(status => ({
          seatId: status.seatId,
          row: status.seat.row,
          column: status.seat.column.toString(),
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

  async validateSeatAndShowtime(seatRoomId: string, showtimeId: string) {
    const showtime = await this.redisClient.hgetall(`showtime:${showtimeId}`);
    if (!showtime || !showtime.room_id) {
      throw new Error('Showtime not found');
    }
    if (seatRoomId !== showtime.room_id) {
      throw new Error('Seat and showtime room IDs do not match');
    }
    return true;
  }

  async holdSeats(data: HoldSeatsDto) {
    const heldSeats: {id: string, priceRatio: number}[] = [];
    const failedSeatIds: string[] = [];
    const holdDuration = data.holdDurationMinutes || 5; // Default 5 minutes

    for (const seatId of data.seatIds) {
      const seat = await this.seatRepository.findOne({ where: { id: seatId } });
      if (!seat) {
        throw new Error('Seat not found');
      }
      await this.validateSeatAndShowtime(seat.roomId, data.showtimeId);
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
          // Check if seat is available, including expired holds
          const seatStatus = await this.seatStatusRepository.findOne({
            where: {
              seatId,
              showtimeId: data.showtimeId,
            },
          });
          let canHold = false;

          if (!seatStatus) {
            // No seat status exists, seat is available
            canHold = true;
          } else if (seatStatus.status === SeatStatusEnum.AVAILABLE) {
            // Seat is explicitly available
            canHold = true;
          } else if (seatStatus.status === SeatStatusEnum.HOLD && seatStatus.holdExpiresAt) {
            // Check if the hold has expired
            const now = new Date();
            if (seatStatus.holdExpiresAt < now) {
              // Hold has expired, treat as available
              canHold = true;
              // Clean up the expired hold
              await this.seatStatusRepository.update(
                { id: seatStatus.id },
                {
                  status: SeatStatusEnum.AVAILABLE,
                  userId: null,
                  holdExpiresAt: null,
                }
              );
            }
          }

          if (canHold) {
            // Create or update seat status to HOLD
            if (!seatStatus) {
              await this.seatStatusRepository.save({
                seatId,
                showtimeId: data.showtimeId,
                status: SeatStatusEnum.HOLD,
                userId: data.userId,
                holdExpiresAt: new Date(Date.now() + holdDuration * 60 * 1000),
              });
            } else {
              await this.seatStatusRepository.update(
                { id: seatStatus.id },
                {
                  status: SeatStatusEnum.HOLD,
                  userId: data.userId,
                  holdExpiresAt: new Date(Date.now() + holdDuration * 60 * 1000),
                }
              );
            }
            heldSeats.push({
              id: seatId,
              priceRatio: seat.priceRatio,
            });
          } else {
            // Seat is not available, release the lock
            await this.redisClient.del(lockKey);
            failedSeatIds.push(seatId);
          }
        } else {
          failedSeatIds.push(seatId);
        }
      } catch (error) {
        this.logger.error(`Error holding seat ${seatId}: ${error.message}`);
        failedSeatIds.push(seatId);
      }
    }

    if (heldSeats.length > 0 && failedSeatIds.length === 0) {      
      this.bookingEventClient.emit('seats_held', {
        showtimeId: data.showtimeId,
        seats: heldSeats,
        userId: data.userId,
      });
    }
    const heldSeatIds = heldSeats.map(seat => seat.id);

    return {
      success: heldSeats.length > 0,
      heldSeatIds,
      failedSeatIds,
      message: heldSeats.length > 0
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
    if (failedSeatIds.length > 0) {
      this.bookingEventClient.emit('seats_expired', {
        bookingId: data.bookingId,
      });
    } else {
      this.bookingEventClient.emit('seats_booked', {
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

  async seed(roomId: string) {
    try {
      const seats = await this.seatRepository.find({
        where: { roomId: roomId },
      });

      if (seats.length > 0) {
        this.logger.log(`Seeds already exist for room ${roomId}`);
        return;
      }

      // Randomly determine the number of rows and columns (between 5 and 15)
      const minRows = 5;
      const maxRows = 15;
      const minCols = 5;
      const maxCols = 15;
      const numRows = Math.floor(Math.random() * (maxRows - minRows + 1)) + minRows;
      const numCols = Math.floor(Math.random() * (maxCols - minCols + 1)) + minCols;

      const seats1 = [];
      for (let row = 1; row <= numRows; row++) {
        for (let col = 1; col <= numCols; col++) {
          const seatType = row <= 2 ? SeatType.VIP : SeatType.NORMAL;
          const priceRatio = row <= 2 ? 1.5 : 1.0;

          seats1.push({
            row: String.fromCharCode(64 + row), // A, B, C, etc.
            column: col,
            type: seatType,
            priceRatio,
            description: `${String.fromCharCode(64 + row)}${col}`,
            roomId: roomId,
          });
        }
      }

      // Save all seats
      await this.seatRepository.save([...seats1]);

      this.logger.log('Seats seeded successfully');
      this.logger.log(`Created ${seats1.length} seats for room ${roomId} (${numRows} rows x ${numCols} columns)`);
    } catch (error) {
      this.logger.error(`Error seeding seats: ${error.message}`);
      throw error;
    }
  }
}