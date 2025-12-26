import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { AuthGrpcService, LoginResponse, UserResponse } from './interfaces';
import { RetryUtil } from '../common/utils/retry.util';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private authService: AuthGrpcService;

  constructor(@Inject('AUTH_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthGrpcService>('AuthService');
  }

  async login(data: { email: string; password: string }): Promise<LoginResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.authService.login(data),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async register(data: { email: string; password: string; fullName: string }): Promise<UserResponse> {
    return RetryUtil.retryWithBackoff(
      () => this.authService.register(data),
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }

  async validateToken(data: { token: string }): Promise<UserResponse> {
    // Token validation is critical for security - use more retries
    return RetryUtil.retryWithBackoff(
      () => this.authService.validateToken(data),
      {
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
      },
    );
  }
}