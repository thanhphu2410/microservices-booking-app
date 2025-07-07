import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListMoviesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['releaseDate', 'voteAverage', 'title', 'createdAt'])
  sortBy?: string = 'releaseDate';

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}