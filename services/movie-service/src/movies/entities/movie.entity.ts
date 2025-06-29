import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('movies')
export class Movie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tmdbId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  overview: string;

  @Column({ nullable: true })
  releaseDate: string;

  @Column({ nullable: true })
  posterPath: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  voteAverage: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  voteCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}