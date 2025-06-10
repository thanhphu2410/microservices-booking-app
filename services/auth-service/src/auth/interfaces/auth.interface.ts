import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ValidateTokenDto } from '../dto/validate-token.dto';
import { UserResponseDto } from '../dto/user-response.dto';

export interface LoginResponse {
  accessToken: string;
  user: UserResponseDto;
}

/**
 * Interface for the Auth gRPC service.
 * This interface defines the contract that other services will use to communicate with the auth service.
 */
export interface AuthServiceClient {
  /**
   * Register a new user
   */
  register(data: RegisterDto): Promise<UserResponseDto>;

  /**
   * Login a user
   */
  login(data: LoginDto): Promise<LoginResponse>;

  /**
   * Validate a user's token
   */
  validateToken(data: ValidateTokenDto): Promise<UserResponseDto>;
}