import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { MovieGrpcService, ListMoviesResponse, SyncDataResponse } from './interfaces';

@Injectable()
export class MoviesService implements OnModuleInit {
  private movieService: MovieGrpcService;

  constructor(@Inject('MOVIE_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.movieService = this.client.getService<MovieGrpcService>('MovieService');
  }

  async listMovies(): Promise<ListMoviesResponse> {
    return this.movieService.listMovies({});
  }

  async syncData(): Promise<SyncDataResponse> {
    return this.movieService.syncData({});
  }
}