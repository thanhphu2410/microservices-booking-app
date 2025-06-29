import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller()
export class MoviesController {
  private readonly logger = new Logger(MoviesController.name);

  constructor(private readonly moviesService: MoviesService) {}

  @GrpcMethod('MovieService', 'ListMovies')
  async listMovies(data: any) {
    try {
      this.logger.log('ListMovies called');
      // Call the service to get movies (stubbed for now)
      const movies = await this.moviesService.listMovies();
      return { movies };
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
      this.logger.log('SyncData called with:');
      const result = await this.moviesService.syncData();
      return result;
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