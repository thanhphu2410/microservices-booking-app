import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ListMoviesResponse, SyncDataResponse, ListMoviesRequest, GetMovieShowtimesRequest, GetMovieShowtimesResponse } from './interfaces';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  async listMovies(@Query() query: ListMoviesRequest): Promise<ListMoviesResponse> {
    return this.moviesService.listMovies(query);
  }

  @Post('/sync-data')
  async syncData(): Promise<SyncDataResponse> {
    return this.moviesService.syncData();
  }

  @Get(':id/showtimes')
  async getMovieShowtimes(@Param('id') id: string): Promise<GetMovieShowtimesResponse> {
    return this.moviesService.getMovieShowtimes({ movieId: id });
  }
}