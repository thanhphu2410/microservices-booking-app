import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { Room } from '../rooms/entities/room.entity';
import { ShowtimeService } from './showtime.service';
import { CreateShowtimeDto } from './dto/showtime.dto';

@Injectable()
export class ShowtimeGenerationService {
  private readonly logger = new Logger(ShowtimeGenerationService.name);

  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    private showtimeService: ShowtimeService,
  ) {}

  async generateShowtimesForMovie(movieId: string, days: number = 7): Promise<void> {
    this.logger.log(`Generating showtimes for movie: ${movieId} for ${days} days`);

    // Get the movie
    const movie = await this.movieRepository.findOne({
      where: { id: movieId }
    });

    if (!movie) {
      this.logger.error(`Movie with id ${movieId} not found`);
      return;
    }

    // Get all active rooms
    const rooms = await this.roomRepository.find({
      where: { isActive: true }
    });

    if (rooms.length === 0) {
      this.logger.warn('No active rooms found for showtime generation');
      return;
    }

    const showtimes = await this.showtimeService.findAllShowtimes({ movieId: movieId });
    if (showtimes.length > 0) {
      this.logger.warn('Showtimes already generated for this movie');
      return;
    }

    // Generate showtimes for each day
    for (let day = 0; day < days; day++) {
      await this.generateShowtimesForDay(movieId, rooms, day);
    }

    this.logger.log(`Successfully generated showtimes for movie: ${movie.title}`);
  }

  private async generateShowtimesForDay(movieId: string, rooms: Room[], dayOffset: number): Promise<void> {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + dayOffset);
    baseDate.setHours(0, 0, 0, 0);

    // Generate 5-8 showtimes per day
    const showtimesPerDay = Math.floor(Math.random() * 4) + 5; // 5-8 showtimes

    for (let i = 0; i < showtimesPerDay; i++) {
      try {
        await this.generateSingleShowtime(movieId, rooms, baseDate, i);
      } catch (error) {
        this.logger.error(`Failed to generate showtime ${i} for day ${dayOffset}: ${error.message}`);
      }
    }
  }

  private async generateSingleShowtime(movieId: string, rooms: Room[], baseDate: Date, showtimeIndex: number): Promise<void> {
    // Randomly select a room
    const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];

    // Calculate start time (between 9 AM and 10 PM)
    const startHour = 9 + Math.floor(Math.random() * 13); // 9 AM to 10 PM
    const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes

    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    // Add some offset based on showtime index to avoid conflicts
    startTime.setMinutes(startTime.getMinutes() + (showtimeIndex * 90));

    // End time is 2-3 hours after start time
    const durationHours = 2 + Math.floor(Math.random() * 2); // 2-3 hours
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + durationHours);

    // Generate random price based on room type
    const basePrice = this.getBasePriceForRoomType(randomRoom.type);
    const priceVariation = 1;
    const price = Math.round(basePrice * priceVariation * 100) / 100; // Round to 2 decimal places

    const createShowtimeDto: CreateShowtimeDto = {
      movieId,
      roomId: randomRoom.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      price,
    };

    try {
      await this.showtimeService.createShowtime(createShowtimeDto);
      this.logger.debug(`Generated showtime: ${startTime.toLocaleString()} - ${endTime.toLocaleString()} in ${randomRoom.name}`);
    } catch (error) {
      // If there's a time conflict, try with a different time
      if (error.message.includes('Time slot conflicts')) {
        this.logger.debug(`Time conflict detected, skipping this showtime`);
        return;
      }
      throw error;
    }
  }

  private getBasePriceForRoomType(roomType: string): number {
    switch (roomType) {
      case 'standard':
        return 12.00;
      case 'premium':
        return 15.00;
      case 'imax':
        return 20.00;
      case 'dolby':
        return 18.00;
      default:
        return 12.00;
    }
  }

  async generateShowtimesForNewMovie(movieId: string): Promise<void> {
    this.logger.log(`Generating showtimes for newly synced movie: ${movieId}`);
    await this.generateShowtimesForMovie(movieId, 7); // Generate for 7 days
  }
}