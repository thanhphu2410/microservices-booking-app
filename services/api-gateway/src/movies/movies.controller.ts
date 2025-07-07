import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ListMoviesResponse, SyncDataResponse, ListMoviesRequest } from './interfaces';

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
}