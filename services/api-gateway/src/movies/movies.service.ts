import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { MovieGrpcService, ListMoviesResponse, SyncDataResponse, ListMoviesRequest, GetMovieShowtimesRequest, GetMovieShowtimesResponse, ListRoomsResponse, RoomGrpcService } from './interfaces';
import { RetryUtil } from '../common/utils/retry.util';

@Injectable()
export class MoviesService implements OnModuleInit {
  private readonly logger = new Logger(MoviesService.name);
  private movieService: MovieGrpcService;
  private roomService: RoomGrpcService;

  constructor(@Inject('MOVIE_SERVICE') private client: ClientGrpc, @Inject('ROOM_SERVICE') private roomClient: ClientGrpc) {}

  onModuleInit() {
    this.movieService = this.client.getService<MovieGrpcService>('MovieService');
    this.roomService = this.roomClient.getService<RoomGrpcService>('RoomService');
  }

  async listMovies(params: ListMoviesRequest = {}): Promise<ListMoviesResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.movieService.listMovies(params),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async syncData(): Promise<SyncDataResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.movieService.syncData({}),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async getMovieShowtimes(params: GetMovieShowtimesRequest): Promise<GetMovieShowtimesResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.movieService.getMovieShowtimes(params),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async listRooms(): Promise<ListRoomsResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.roomService.getAllRooms({}),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }
}