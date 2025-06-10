import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private async validateDto<T>(data: any, dto: new () => T): Promise<T> {
    const instance = plainToInstance(dto, data);
    const errors = await validate(instance as object);
    console.log('errors', errors);

    if (errors.length > 0) {
      const errorMessages = errors
        .map(error => Object.values(error.constraints || {}))
        .flat()
        .filter(Boolean);

      throw new RpcException({
        message: 'Validation failed',
        details: errorMessages
      });
    }

    return instance;
  }

  @GrpcMethod('AuthService', 'Register')
  async register(data: any) {
    try {
      const registerDto = await this.validateDto(data, RegisterDto);
      const user = await this.authService.register(registerDto);
      return plainToInstance(UserResponseDto, user);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Registration failed',
        details: error.message
      });
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: any) {
    try {
      const loginDto = await this.validateDto(data, LoginDto);
      const result = await this.authService.login(loginDto.email, loginDto.password);
      return {
        accessToken: result.access_token,
        user: plainToInstance(UserResponseDto, result.user),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Login failed',
        details: error.message
      });
    }
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: any) {
    try {
      console.log('data', data);
      const validateTokenDto = await this.validateDto(data, ValidateTokenDto);
      const user = await this.authService.validateToken(validateTokenDto);
      return plainToInstance(UserResponseDto, user);
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        message: 'Token validation failed',
        details: error.message
      });
    }
  }
}