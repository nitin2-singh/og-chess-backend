import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup-dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { Public } from 'src/decorators/is-public.decorator';
import { LoginDto } from './dtos/login-dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() signupDto: SignupDto): Promise<UserResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): Promise<UserResponseDto> {
    return this.authService.login(loginDto);
  }
}
