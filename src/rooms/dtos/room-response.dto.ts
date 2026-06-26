import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { UserResponseDto } from '../../auth/dtos/user-response.dto';
import { GameResult, GameStatus } from 'src/database/game/game.entity';

export class RoomResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  room_code: string;

  @ApiProperty({
    enum: GameStatus,
  })
  @Expose()
  status: GameStatus;

  @ApiProperty({
    enum: GameResult,
    nullable: true,
  })
  @Expose()
  result: GameResult;

  @Expose()
  @Type(() => UserResponseDto)
  white_player: UserResponseDto | null;

  @Expose()
  @Type(() => UserResponseDto)
  black_player: UserResponseDto | null;

  @Expose()
  @Type(() => UserResponseDto)
  created_by: UserResponseDto;

  @Expose()
  @Type(() => UserResponseDto)
  winner: UserResponseDto | null;

  @ApiProperty()
  @Expose()
  started_at: number;

  @ApiProperty()
  @Expose()
  ended_at: number;

  @ApiProperty()
  @Expose()
  created_at: number;

  @ApiProperty()
  @Expose()
  updated_at: number;

  @ApiProperty({ type: [String] })
  @Expose()
  moves: string[];
}

export class PaginatedRoomsDto {
  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  total: number;

  @Expose()
  total_pages: number;

  @Expose()
  @Type(() => RoomResponseDto)
  rooms: RoomResponseDto[];
}
