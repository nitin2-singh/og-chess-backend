import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum PlayerColor {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export class CreateRoomDto {
  @ApiProperty({
    example: "Nitin's Room",
    minLength: 3,
    maxLength: 100,
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: PlayerColor,
    example: PlayerColor.WHITE,
  })
  @Expose()
  @IsEnum(PlayerColor)
  color: PlayerColor;
}

export class GetRoomsDto {
  @ApiPropertyOptional({
    default: 1,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    default: 10,
    maximum: 100,
  })
  @Expose()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit = 10;

  @ApiPropertyOptional({
    example: 'Ranked',
  })
  @Expose()
  @IsOptional()
  @IsString()
  search?: string;
}
