import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { AuthGrpcService, LoginResponse, UserResponse } from './interfaces';

@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthGrpcService;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthGrpcService>('AuthService');
  }

  async login(data: { email: string; password: string }): Promise<LoginResponse> {
    return this.authService.login(data);
  }

  async register(data: { email: string; password: string; fullName: string }): Promise<UserResponse> {
    return this.authService.register(data);
  }

  async validateToken(data: { token: string }): Promise<UserResponse> {
    return this.authService.validateToken(data);
  }
}