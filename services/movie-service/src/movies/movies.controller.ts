import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ClientProxy } from '@nestjs/microservices';
import { ListMoviesDto } from './dto/list-movies.dto';
import { ListMoviesResponseDto } from './dto/movie-response.dto';

@Controller()
export class MoviesController {
  private readonly logger = new Logger(MoviesController.name);

  constructor(
    private readonly moviesService: MoviesService,
    @Inject('MOVIE_SYNC_SERVICE') private readonly movieSyncClient: ClientProxy,
  ) {}

  @GrpcMethod('MovieService', 'ListMovies')
  async listMovies(data: ListMoviesDto): Promise<ListMoviesResponseDto> {
    try {
      const result = await this.moviesService.listMovies(data);
      return result;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'ListMovies failed',
        details: error.message,
      });
    }
  }

  @GrpcMethod('MovieService', 'SyncData')
  async syncData() {
    try {
      // const result = await this.moviesService.syncData();
      this.movieSyncClient.emit('sync_movies', {});
      return { message: 'Movie sync job enqueued' };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'SyncData failed',
        details: error.message,
      });
    }
  }
}