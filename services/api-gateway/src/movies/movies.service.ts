import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { MovieGrpcService, ListMoviesResponse, SyncDataResponse, ListMoviesRequest, GetMovieShowtimesRequest, GetMovieShowtimesResponse } from './interfaces';

@Injectable()
export class MoviesService implements OnModuleInit {
  private movieService: MovieGrpcService;

  constructor(@Inject('MOVIE_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.movieService = this.client.getService<MovieGrpcService>('MovieService');
  }

  async listMovies(params: ListMoviesRequest = {}): Promise<ListMoviesResponse> {
    return this.movieService.listMovies(params);
  }

  async syncData(): Promise<SyncDataResponse> {
    return this.movieService.syncData({});
  }

  async getMovieShowtimes(params: GetMovieShowtimesRequest): Promise<GetMovieShowtimesResponse> {
    return this.movieService.getMovieShowtimes(params);
  }
}