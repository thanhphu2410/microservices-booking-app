import { Controller, Post, Body, UnauthorizedException, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponse, UserResponse } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }): Promise<LoginResponse> {
    return this.authService.login(loginData);
  }

  @Post('register')
  async register(@Body() registerData: { email: string; password: string; fullName: string }): Promise<UserResponse> {
    return this.authService.register(registerData);
  }

  @Get('me')
  async getMe(@Headers('authorization') authHeader: string): Promise<UserResponse> {
    // Extract token from Bearer token
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    return this.authService.validateToken({ token });
  }
}