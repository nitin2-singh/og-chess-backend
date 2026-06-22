import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dtos/user-response.dto';
import { User } from 'src/database/user/user.entity';
import { SignupDto } from './dtos/signup-dto';
import { JwtPayload } from 'src/stratergies/jwt-stratergies';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login-dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: signupDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    const password = await bcrypt.hash(signupDto.password, 10);
    const now = Math.floor(Date.now() / 1000);

    const user = this.userRepository.create({
      email: signupDto.email,
      first_name: signupDto.first_name,
      last_name: signupDto.last_name,
      password,
      created_at: now,
      updated_at: now,
    });

    const savedUser = await this.userRepository.save({
      ...user,
    });

    const tokens = await this.generateTokens({
      id: savedUser.id,
      email: savedUser.email,
    });

    await this.userRepository.update(
      { id: savedUser.id },
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        updated_at: Math.floor(Date.now() / 1000),
      },
    );

    savedUser.access_token = tokens.access_token;
    savedUser.refresh_token = tokens.refresh_token;

    return plainToInstance(UserResponseDto, savedUser, {
      excludeExtraneousValues: true,
    });
  }

  async login(loginDto: LoginDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        email: loginDto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.generateTokens(user);

    await this.userRepository.update(
      { id: user.id },
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        updated_at: Math.floor(Date.now() / 1000),
      },
    );

    user.access_token = tokens.access_token;
    user.refresh_token = tokens.refresh_token;

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToInstance(UserResponseDto, user);
  }

  private async generateTokens(user: { id: string; email: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
        expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
