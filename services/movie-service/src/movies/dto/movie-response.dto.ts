export class MovieResponseDto {
  id: string;
  title: string;
  overview?: string;
  releaseDate?: string;
  posterPath?: string;
  createdAt: Date;
  updatedAt: Date;
}