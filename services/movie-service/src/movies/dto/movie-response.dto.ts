export class MovieResponseDto {
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

export class PaginationInfoDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class ListMoviesResponseDto {
  movies: MovieResponseDto[];
  pagination: PaginationInfoDto;
}