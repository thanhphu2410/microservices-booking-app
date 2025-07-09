import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Showtime, ShowtimeStatus } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Room } from '../rooms/entities/room.entity';
import { Repository, Between, Not } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateShowtimeDto, UpdateShowtimeDto, ShowtimeResponseDto, ListShowtimesDto } from './dto/showtime.dto';

@Injectable()
export class ShowtimeService {
  private readonly logger = new Logger(ShowtimeService.name);

  constructor(
    @InjectRepository(Showtime)
    private showtimeRepository: Repository<Showtime>,
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  async createShowtime(createShowtimeDto: CreateShowtimeDto): Promise<ShowtimeResponseDto> {
    this.logger.log(`Creating showtime for movie: ${createShowtimeDto.movieId}`);

    // Validate movie exists
    const movie = await this.movieRepository.findOne({
      where: { id: createShowtimeDto.movieId }
    });

    if (!movie) {
      throw new NotFoundException(`Movie with id '${createShowtimeDto.movieId}' not found`);
    }

    // Validate room exists and is active
    const room = await this.roomRepository.findOne({
      where: { id: createShowtimeDto.roomId }
    });

    if (!room) {
      throw new NotFoundException(`Room with id '${createShowtimeDto.roomId}' not found`);
    }

    if (!room.isActive) {
      throw new BadRequestException(`Room '${room.name}' is not active`);
    }

    // Validate time conflicts
    const startTime = new Date(createShowtimeDto.startTime);
    const endTime = new Date(createShowtimeDto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Check for time conflicts in the same room
    const conflictingShowtime = await this.showtimeRepository.findOne({
      where: {
        roomId: createShowtimeDto.roomId,
        status: ShowtimeStatus.SCHEDULED,
        startTime: Between(startTime, endTime)
      }
    });

    if (conflictingShowtime) {
      throw new BadRequestException('Time slot conflicts with existing showtime');
    }

    const showtime = this.showtimeRepository.create({
      ...createShowtimeDto,
      startTime,
      endTime,
    });

    const savedShowtime = await this.showtimeRepository.save(showtime);

    this.logger.log(`Showtime created successfully: ${savedShowtime.id}`);

    return this.mapToResponseDto(savedShowtime);
  }

  async findAllShowtimes(listShowtimesDto: ListShowtimesDto = {}): Promise<ShowtimeResponseDto[]> {
    const queryBuilder = this.showtimeRepository
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('showtime.room', 'room')
      .orderBy('showtime.startTime', 'ASC');

    if (listShowtimesDto.movieId) {
      queryBuilder.andWhere('showtime.movieId = :movieId', { movieId: listShowtimesDto.movieId });
    }

    if (listShowtimesDto.roomId) {
      queryBuilder.andWhere('showtime.roomId = :roomId', { roomId: listShowtimesDto.roomId });
    }

    if (listShowtimesDto.status) {
      queryBuilder.andWhere('showtime.status = :status', { status: listShowtimesDto.status });
    }

    if (listShowtimesDto.startDate) {
      const startDate = new Date(listShowtimesDto.startDate);
      queryBuilder.andWhere('showtime.startTime >= :startDate', { startDate });
    }

    if (listShowtimesDto.endDate) {
      const endDate = new Date(listShowtimesDto.endDate);
      queryBuilder.andWhere('showtime.startTime <= :endDate', { endDate });
    }

    const showtimes = await queryBuilder.getMany();

    return showtimes.map(showtime => this.mapToResponseDto(showtime));
  }

  async findShowtimeById(id: string): Promise<ShowtimeResponseDto> {
    this.logger.log(`Fetching showtime by id: ${id}`);

    const showtime = await this.showtimeRepository.findOne({
      where: { id },
      relations: ['movie', 'room']
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with id '${id}' not found`);
    }

    return this.mapToResponseDto(showtime);
  }

  async findUpcomingShowtimes(): Promise<ShowtimeResponseDto[]> {
    this.logger.log('Fetching upcoming showtimes');

    const now = new Date();
    const showtimes = await this.showtimeRepository.find({
      where: {
        startTime: Between(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)), // Next 30 days
        status: ShowtimeStatus.SCHEDULED
      },
      relations: ['movie', 'room'],
      order: { startTime: 'ASC' }
    });

    return showtimes.map(showtime => this.mapToResponseDto(showtime));
  }

  async updateShowtime(id: string, updateShowtimeDto: UpdateShowtimeDto): Promise<ShowtimeResponseDto> {
    this.logger.log(`Updating showtime: ${id}`);

    const showtime = await this.showtimeRepository.findOne({
      where: { id },
      relations: ['movie', 'room']
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with id '${id}' not found`);
    }

    // Validate movie if being updated
    if (updateShowtimeDto.movieId && updateShowtimeDto.movieId !== showtime.movieId) {
      const movie = await this.movieRepository.findOne({
        where: { id: updateShowtimeDto.movieId }
      });

      if (!movie) {
        throw new NotFoundException(`Movie with id '${updateShowtimeDto.movieId}' not found`);
      }
    }

    // Validate room if being updated
    if (updateShowtimeDto.roomId && updateShowtimeDto.roomId !== showtime.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: updateShowtimeDto.roomId }
      });

      if (!room) {
        throw new NotFoundException(`Room with id '${updateShowtimeDto.roomId}' not found`);
      }

      if (!room.isActive) {
        throw new BadRequestException(`Room '${room.name}' is not active`);
      }
    }

    // Validate time conflicts if times are being updated
    if (updateShowtimeDto.startTime || updateShowtimeDto.endTime) {
      const startTime = updateShowtimeDto.startTime ? new Date(updateShowtimeDto.startTime) : showtime.startTime;
      const endTime = updateShowtimeDto.endTime ? new Date(updateShowtimeDto.endTime) : showtime.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      const roomId = updateShowtimeDto.roomId || showtime.roomId;

      // Check for time conflicts in the same room
      const conflictingShowtime = await this.showtimeRepository.findOne({
        where: {
          id: Not(id),
          roomId,
          status: ShowtimeStatus.SCHEDULED,
          startTime: Between(startTime, endTime)
        }
      });

      if (conflictingShowtime) {
        throw new BadRequestException('Time slot conflicts with existing showtime');
      }
    }

    Object.assign(showtime, updateShowtimeDto);

    if (updateShowtimeDto.startTime) {
      showtime.startTime = new Date(updateShowtimeDto.startTime);
    }
    if (updateShowtimeDto.endTime) {
      showtime.endTime = new Date(updateShowtimeDto.endTime);
    }

    const updatedShowtime = await this.showtimeRepository.save(showtime);

    this.logger.log(`Showtime updated successfully: ${id}`);

    return this.mapToResponseDto(updatedShowtime);
  }

  async deleteShowtime(id: string): Promise<void> {
    this.logger.log(`Deleting showtime: ${id}`);

    const showtime = await this.showtimeRepository.findOne({
      where: { id }
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with id '${id}' not found`);
    }

    await this.showtimeRepository.remove(showtime);

    this.logger.log(`Showtime deleted successfully: ${id}`);
  }

  async cancelShowtime(id: string): Promise<ShowtimeResponseDto> {
    this.logger.log(`Cancelling showtime: ${id}`);

    const showtime = await this.showtimeRepository.findOne({
      where: { id }
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with id '${id}' not found`);
    }

    if (showtime.status === ShowtimeStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed showtime');
    }

    showtime.status = ShowtimeStatus.CANCELLED;
    const updatedShowtime = await this.showtimeRepository.save(showtime);

    this.logger.log(`Showtime cancelled successfully: ${id}`);

    return this.mapToResponseDto(updatedShowtime);
  }

  async updateBookedSeats(id: string, bookedSeats: number): Promise<ShowtimeResponseDto> {
    this.logger.log(`Updating booked seats for showtime: ${id}`);

    const showtime = await this.showtimeRepository.findOne({
      where: { id },
      relations: ['room']
    });

    if (!showtime) {
      throw new NotFoundException(`Showtime with id '${id}' not found`);
    }

    const updatedShowtime = await this.showtimeRepository.save(showtime);

    this.logger.log(`Booked seats updated successfully: ${id}`);

    return this.mapToResponseDto(updatedShowtime);
  }

  private mapToResponseDto(showtime: Showtime): ShowtimeResponseDto {
    return {
      id: showtime.id,
      movieId: showtime.movieId,
      roomId: showtime.roomId,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      price: showtime.price,
      status: showtime.status,
      createdAt: showtime.createdAt,
      updatedAt: showtime.updatedAt,
      movie: showtime.movie ? {
        id: showtime.movie.id,
        title: showtime.movie.title,
        posterPath: showtime.movie.posterPath
      } : undefined,
      room: showtime.room ? {
        id: showtime.room.id,
        name: showtime.room.name,
        type: showtime.room.type
      } : undefined,
    };
  }
}