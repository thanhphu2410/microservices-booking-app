import { Injectable, Logger } from '@nestjs/common';
import { Movie } from './entities/movie.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TMDBMoviesResponse, TMDBMovie } from './interfaces/tmdb.interface';

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);
  private readonly tmdbApiKey: string;
  private readonly tmdbBaseUrl = 'https://api.themoviedb.org/3';

  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    private configService: ConfigService,
  ) {
    this.tmdbApiKey = this.configService.get<string>('TMDB_API_KEY');
    if (!this.tmdbApiKey) {
      this.logger.warn('TMDB_API_KEY not found in environment variables');
    }
  }

  async listMovies() {
    const movies = await this.movieRepository.find();
    return movies;
  }

  async syncData(totalCount: number = 500) {
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

    if (existingMovie) {
      // Update existing movie
      existingMovie.overview = tmdbMovie.overview;
      existingMovie.releaseDate = tmdbMovie.release_date;
      existingMovie.posterPath = tmdbMovie.poster_path;
      existingMovie.voteAverage = tmdbMovie.vote_average;
      existingMovie.voteCount = tmdbMovie.vote_count;
      await this.movieRepository.save(existingMovie);
      this.logger.debug(`Updated existing movie: ${tmdbMovie.title}`);
    } else {
      // Create new movie
      const newMovie = this.movieRepository.create({
        title: tmdbMovie.title,
        tmdbId: tmdbMovie.id,
        overview: tmdbMovie.overview,
        releaseDate: tmdbMovie.release_date,
        posterPath: tmdbMovie.poster_path,
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
      });
      await this.movieRepository.save(newMovie);
      this.logger.debug(`Created new movie: ${tmdbMovie.title}`);
    }
  }
}