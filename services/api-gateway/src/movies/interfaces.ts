export interface Movie {
  id: string;
  title: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListMoviesResponse {
  movies: Movie[];
}

export interface SyncDataResponse {
  success: boolean;
  message: string;
  errors: string[];
}

export interface MovieGrpcService {
  listMovies(data: {}): Promise<ListMoviesResponse>;
  syncData(data: {}): Promise<SyncDataResponse>;
}