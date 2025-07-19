import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any): Promise<any> {
    try {
      // The payload contains the user ID in the 'sub' field
      const userId = payload.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Return the user object that will be attached to the request
      return {
        id: userId,
        email: payload.email,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}