import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { MovieGrpcService, ListMoviesResponse, SyncDataResponse, ListMoviesRequest, GetMovieShowtimesRequest, GetMovieShowtimesResponse, ListRoomsResponse, RoomGrpcService } from './interfaces';

@Injectable()
export class MoviesService implements OnModuleInit {
  private movieService: MovieGrpcService;
  private roomService: RoomGrpcService;

  constructor(@Inject('MOVIE_SERVICE') private client: ClientGrpc, @Inject('ROOM_SERVICE') private roomClient: ClientGrpc) {}

  onModuleInit() {
    this.movieService = this.client.getService<MovieGrpcService>('MovieService');
    this.roomService = this.roomClient.getService<RoomGrpcService>('RoomService');
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

  async listRooms(): Promise<ListRoomsResponse> {
    return this.roomService.getAllRooms({});
  }
}