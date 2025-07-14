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

export interface GetMovieShowtimesRequest {
  movieId: string;
}

export interface MovieShowtimeRoom {
  id: string;
  name: string;
}

export interface MovieShowtimeItem {
  showtimeId: string;
  room: MovieShowtimeRoom;
  startTime: string;
  basePrice: number;
}

export interface GetMovieShowtimesResponse {
  movieId: string;
  title: string;
  showtimes: MovieShowtimeItem[];
}

export enum RoomType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  IMAX = 'imax',
  DOLBY = 'dolby',
}

export interface Room {
  id: string;
  name: string;
  total_rows: number;
  total_cols: number;
  type: RoomType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListRoomsResponse {
  rooms: Room[];
}

export interface MovieGrpcService {
  listMovies(data: ListMoviesRequest): Promise<ListMoviesResponse>;
  syncData(data: {}): Promise<SyncDataResponse>;
  getMovieShowtimes(data: GetMovieShowtimesRequest): Promise<GetMovieShowtimesResponse>;
}

export interface RoomGrpcService {
  getAllRooms(data: {}): Promise<ListRoomsResponse>;
}