import { Injectable, Logger } from '@nestjs/common';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TMDBMoviesResponse, TMDBMovie } from './interfaces/tmdb.interface';
import { ListMoviesDto } from './dto/list-movies.dto';
import { ListMoviesResponseDto } from './dto/movie-response.dto';
import { ShowtimeGenerationService } from '../showtimes/showtime-generation.service';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly tmdbApiKey: string;
  private readonly tmdbBaseUrl = 'https://api.themoviedb.org/3';

  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    private configService: ConfigService,
    private showtimeGenerationService: ShowtimeGenerationService,
  ) {
    this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!this.tmdbApiKey) {
      this.logger.warn('TMDB_API_KEY not found in environment variables');
    }
  }

  async listMovies(listMoviesDto: ListMoviesDto = {}): Promise<ListMoviesResponseDto> {
    const { page = 1, limit = 20, sortBy = 'releaseDate', sortOrder = 'DESC' } = listMoviesDto;

    const skip = (page - 1) * limit;

    const [movies, total] = await this.movieRepository.findAndCount({
      skip,
      take: limit,
      order: {
        [sortBy]: sortOrder,
      },
    });

    // Transform the movies to match the proto types
    const transformedMovies = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview || '',
      releaseDate: movie.releaseDate || '',
      posterPath: movie.posterPath || '',
      backdropPath: movie.backdropPath || '',
      voteAverage: movie.voteAverage ? parseFloat(movie.voteAverage.toString()) : 0,
      voteCount: movie.voteCount ? parseInt(movie.voteCount.toString()) : 0,
      createdAt: movie.createdAt.toISOString(),
      updatedAt: movie.updatedAt.toISOString(),
    }));

    return {
      movies: transformedMovies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async syncData(totalCount: number = 1000) {
    this.logger.log('Starting data sync from TMDB', this.tmdbApiKey);

    if (!this.tmdbApiKey) {
      return {
        success: false,
        message: 'TMDB API key not configured',
        errors: ['TMDB_API_KEY environment variable is required'],
      };
    }

    try {
      const errors: string[] = [];
      let syncedCount = 0;
      const pageSize = 20;
      const totalPages = Math.ceil(totalCount / pageSize);

      for (let page = 1; page <= totalPages; page++) {
        let moviesPage: TMDBMovie[] = [];
        try {
          moviesPage = await this.fetchPopularMoviesPage(page);
        } catch (error) {
          const errorMsg = `Failed to fetch page ${page} from TMDB: ${error.message}`;
          this.logger.error(errorMsg);
          errors.push(errorMsg);
          break;
        }
        for (const tmdbMovie of moviesPage) {
          if (syncedCount >= totalCount) break;
          try {
            await this.syncMovie(tmdbMovie);
            syncedCount++;
          } catch (error) {
            const errorMsg = `Failed to sync movie ${tmdbMovie.title}: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }
        if (syncedCount >= totalCount) break;
      }

      this.logger.log(`Successfully synced ${syncedCount} movies`);

      return {
        success: true,
        message: `Successfully synced ${syncedCount} movies from TMDB`,
        errors,
        syncedCount,
      };
    } catch (error) {
      this.logger.error('Sync failed:', error);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
        errors: [error.message],
      };
    }
  }



  private async fetchPopularMoviesPage(page: number): Promise<TMDBMovie[]> {
    try {
      const response = await axios.get<TMDBMoviesResponse>(
        `${this.tmdbBaseUrl}/movie/now_playing`,
        {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${this.tmdbApiKey}`,
          },
          params: {
            language: 'en-US',
            page,
          },
        }
      );
      this.logger.log(`Fetched page ${page}: ${response.data.results.length} movies`);
      return response.data.results;
    } catch (error) {
      this.logger.error(`Failed to fetch popular movies from TMDB (page ${page}):`, error);
      throw new Error(`TMDB API request failed (page ${page}): ${error.message}`);
    }
  }

  private async syncMovie(tmdbMovie: TMDBMovie): Promise<void> {
    // Check if movie already exists
    const existingMovie = await this.movieRepository.findOne({
      where: [{ tmdbId: tmdbMovie.id }],
    });

    let movieId: string;

    if (existingMovie) {
      // Update existing movie
      existingMovie.overview = tmdbMovie.overview;
      existingMovie.releaseDate = tmdbMovie.release_date;
      existingMovie.posterPath = tmdbMovie.poster_path;
      existingMovie.backdropPath = tmdbMovie.backdrop_path;
      existingMovie.voteAverage = tmdbMovie.vote_average;
      existingMovie.voteCount = tmdbMovie.vote_count;
      await this.movieRepository.save(existingMovie);
      movieId = existingMovie.id;
      this.logger.debug(`Updated existing movie: ${tmdbMovie.title}`);
    } else {
      // Create new movie
      const newMovie = this.movieRepository.create({
        title: tmdbMovie.title,
        tmdbId: tmdbMovie.id,
        overview: tmdbMovie.overview,
        releaseDate: tmdbMovie.release_date,
        posterPath: tmdbMovie.poster_path,
        backdropPath: tmdbMovie.backdrop_path,
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
      });
      const savedMovie = await this.movieRepository.save(newMovie);
      movieId = savedMovie.id;
      this.logger.debug(`Created new movie: ${tmdbMovie.title}`);
    }

    // Generate showtimes for the movie (only for new movies)
    if (!existingMovie) {
      try {
        await this.showtimeGenerationService.generateShowtimesForNewMovie(movieId);
        this.logger.debug(`Generated showtimes for new movie: ${tmdbMovie.title}`);
      } catch (error) {
        this.logger.error(`Failed to generate showtimes for movie ${tmdbMovie.title}: ${error.message}`);
      }
    }
  }
}