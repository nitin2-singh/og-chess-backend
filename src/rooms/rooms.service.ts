import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameStatus } from 'src/database/game/game.entity';
import { User } from 'src/database/user/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRoomDto,
  GetRoomsDto,
  PlayerColor,
} from './dtos/create-room.dto';
import { PaginatedRoomsDto, RoomResponseDto } from './dtos/room-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createRoom(
    userId: string,
    dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const now = Math.floor(Date.now() / 1000);

    const prevGame = await this.gameRepository.findOne({
      where: { room_code: dto.name },
    });

    if (prevGame) {
      throw new ConflictException('Room Already in use.');
    }

    const game = this.gameRepository.create({
      room_code: dto.name,
      status: GameStatus.WAITING,
      created_by: user,
      created_at: now,
      updated_at: now,
    });

    if (dto.color === PlayerColor.WHITE) {
      game.white_player = user;
    } else {
      game.black_player = user;
    }

    const savedGame = await this.gameRepository.save(game);

    return plainToInstance(RoomResponseDto, savedGame, {
      excludeExtraneousValues: true,
    });
  }

  async getRooms(
    userId: string,
    query: GetRoomsDto,
  ): Promise<PaginatedRoomsDto> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const qb = this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.white_player', 'white_player')
      .leftJoinAndSelect('game.black_player', 'black_player')
      .leftJoinAndSelect('game.created_by', 'created_by')
      .leftJoinAndSelect('game.winner', 'winner')
      .where(
        `(
        game.created_by = :userId
        OR game.white_player_id = :userId
        OR game.black_player_id = :userId
      )`,
        {
          userId,
        },
      );

    if (query.search) {
      qb.andWhere(`LOWER(game.room_code) LIKE LOWER(:search)`, {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('game.created_at', 'DESC');

    qb.skip(skip);

    qb.take(limit);

    const [rooms, total] = await qb.getManyAndCount();

    return {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      rooms: plainToInstance(RoomResponseDto, rooms, {
        excludeExtraneousValues: true,
      }),
    };
  }

  async getRoomById(roomId: string): Promise<RoomResponseDto> {
    const room = await this.gameRepository.findOne({
      where: { room_code: roomId },
      relations: {
        white_player: true,
        black_player: true,
        created_by: true,
        winner: true,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return plainToInstance(RoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }
}
