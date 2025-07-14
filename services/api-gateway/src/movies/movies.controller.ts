import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ListMoviesResponse, SyncDataResponse, ListMoviesRequest, GetMovieShowtimesRequest, GetMovieShowtimesResponse } from './interfaces';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('movies')
@UseGuards(JwtAuthGuard)
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