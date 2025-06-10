export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserResponse;
}

export interface AuthGrpcService {
  login(data: { email: string; password: string }): Promise<LoginResponse>;
  register(data: { email: string; password: string; fullName: string }): Promise<UserResponse>;
  validateToken(data: { token: string }): Promise<UserResponse>;
}