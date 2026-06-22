// src/users/dto/user-response.dto.ts
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 'f7f5b8d3-3d5c-4d8b-8d0d-fd7a0b5d7e4d',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'nitin@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    example: 'Nitin',
  })
  @Expose()
  first_name: string;

  @ApiProperty({
    example: '12Bi',
  })
  @Expose()
  access_token: string;

  @ApiProperty({
    example: '12Bi',
  })
  @Expose()
  refresh_token: string;

  @ApiProperty({
    example: 'Negi',
  })
  @Expose()
  last_name: string;

  @ApiProperty({
    example: '2026-06-21T10:15:30.000Z',
  })
  @Expose()
  created_at: number;

  @ApiProperty({
    example: '2026-06-21T10:20:15.000Z',
  })
  @Expose()
  updated_at: number;
}
