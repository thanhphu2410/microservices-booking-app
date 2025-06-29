import { Controller, Get, Post, Body } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ListMoviesResponse, SyncDataResponse } from './interfaces';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  async listMovies(): Promise<ListMoviesResponse> {
    
    return this.moviesService.listMovies();
  }

  @Post('/sync-data')
  async syncData(): Promise<SyncDataResponse> {
    return this.moviesService.syncData();
  }
}