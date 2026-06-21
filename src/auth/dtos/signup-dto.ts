// src/auth/dto/signup.dto.ts
import { Expose } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    example: 'nitin@example.com',
  })
  @Expose()
  @IsEmail({}, { message: 'Invalid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @ApiProperty({
    example: 'Nitin',
  })
  @Expose()
  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MinLength(2, {
    message: 'First name must be at least 2 characters.',
  })
  @MaxLength(50, {
    message: 'First name cannot exceed 50 characters.',
  })
  first_name: string;

  @ApiProperty({
    example: 'Negi',
  })
  @Expose()
  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MinLength(2, {
    message: 'Last name must be at least 2 characters.',
  })
  @MaxLength(50, {
    message: 'Last name cannot exceed 50 characters.',
  })
  last_name: string;

  @ApiProperty({
    example: 'Password@123',
  })
  @Expose()
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters.',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|\\:;"'<>,./~`]).{8,}$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password: string;
}
