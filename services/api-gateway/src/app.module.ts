import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { SeatsModule } from './seats/seats.module';
import { BookingsModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    MoviesModule,
    SeatsModule,
    BookingsModule,
  ],
})
export class AppModule {}
