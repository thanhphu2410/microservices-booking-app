import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    @Inject('NOTIFICATION_SERVICE') private notificationClient: ClientProxy,
  ) {}

  async register(registerDto: {
    email: string;
    password: string;
    fullName: string;
  }) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new RpcException({
        message: 'Email already exists',
        details: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);
    const { password, ...result } = user;

    // Send message to RabbitMQ
    this.notificationClient.emit('user_registered', {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      event: 'user_registered',
      timestamp: new Date().toISOString(),
    })
    
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  async validateToken(data: { token: string }): Promise<any> {
    try {
      // Verify and decode the token
      const payload = await this.jwtService.verifyAsync(data.token);

      // Get user from database using the sub (user id) from token
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { password, ...result } = user;
      return result;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}