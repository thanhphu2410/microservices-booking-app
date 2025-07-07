export interface Movie {
  id: string;
  title: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string;
  backdropPath?: string;
  voteAverage?: number;
  voteCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListMoviesResponse {
  movies: Movie[];
  pagination: PaginationInfo;
}

export interface SyncDataResponse {
  success: boolean;
  message: string;
  errors: string[];
}

export interface ListMoviesRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface MovieGrpcService {
  listMovies(data: ListMoviesRequest): Promise<ListMoviesResponse>;
  syncData(data: {}): Promise<SyncDataResponse>;
}