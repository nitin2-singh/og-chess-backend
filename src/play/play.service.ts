import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Chess } from 'chess.js';
import { Server } from 'socket.io';
import { Repository } from 'typeorm';

import { Game, GameStatus, GameResult } from 'src/database/game/game.entity';
import { User } from 'src/database/user/user.entity';
import { JwtPayload } from 'src/stratergies/jwt-stratergies';
import {
  ActiveRoom,
  AuthenticatedSocket,
  MovePayload,
} from './dtos/socket.dto';

@Injectable()
export class PlayService {
  private readonly rooms = new Map<string, ActiveRoom>();

  private readonly games = new Map<string, Chess>();

  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async authenticate(client: AuthenticatedSocket): Promise<void> {
    const token =
      (client.handshake.auth.token as string | undefined) ??
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      client.data.user = payload;
    } catch {
      client.disconnect(true);
    }
  }

  disconnect(client: AuthenticatedSocket): void {
    const userId = client.data.user?.sub;

    if (!userId) return;

    for (const [roomId, room] of this.rooms.entries()) {
      const isPlayer =
        room.whitePlayerId === userId || room.blackPlayerId === userId;

      if (isPlayer) {
        void client.leave(roomId);
      }
    }
  }

  async joinRoom(
    client: AuthenticatedSocket,
    roomCode: string,
  ): Promise<{
    success: boolean;
    room: ActiveRoom;
    fen: string;
    roomId: string;
  }> {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const dbRoom = await this.gameRepository.findOne({
      where: {
        room_code: decodeURIComponent(roomCode),
      },
      relations: {
        white_player: true,
        black_player: true,
      },
    });

    if (!dbRoom) {
      throw new NotFoundException('Room not found');
    }

    const roomId = dbRoom.id;

    let activeRoom = this.rooms.get(roomId);

    if (!activeRoom) {
      const newRoom: ActiveRoom = {
        roomId,
        whitePlayerId: dbRoom.white_player?.id || null,
        blackPlayerId: dbRoom.black_player?.id || null,
        started: dbRoom.status === GameStatus.PLAYING,
        currentTurn: 'w',
        gameOver: dbRoom.status === GameStatus.FINISHED,
      };

      this.rooms.set(roomId, newRoom);

      const gameEngine = new Chess();
      if (dbRoom.moves && dbRoom.moves.length > 0) {
        for (const move of dbRoom.moves) {
          try {
            gameEngine.move(move);
          } catch (e) {
            console.error(`Failed to replay move ${move}:`, e);
          }
        }
      }
      this.games.set(roomId, gameEngine);
      newRoom.currentTurn = gameEngine.turn();
      activeRoom = newRoom;
    }

    if (!activeRoom) {
      throw new NotFoundException('Failed to initialize active room');
    }

    const isWhite = activeRoom.whitePlayerId === userId;
    const isBlack = activeRoom.blackPlayerId === userId;

    if (isWhite || isBlack) {
      // Rejoining player
      await client.join(roomId);
      const game = this.games.get(roomId);

      client.to(roomId).emit('player-reconnected', {
        roomId,
        playerId: userId,
      });

      return {
        success: true,
        room: activeRoom,
        fen: game?.fen() ?? new Chess().fen(),
        roomId,
      };
    }

    // New player trying to join
    if (activeRoom.whitePlayerId && activeRoom.blackPlayerId) {
      throw new BadRequestException('Room already contains 2 players');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!activeRoom.whitePlayerId) {
      activeRoom.whitePlayerId = userId;
      dbRoom.white_player = user;
    } else {
      activeRoom.blackPlayerId = userId;
      dbRoom.black_player = user;
    }

    if (activeRoom.whitePlayerId && activeRoom.blackPlayerId) {
      activeRoom.started = true;
      dbRoom.status = GameStatus.PLAYING;
      dbRoom.started_at = Math.floor(Date.now() / 1000);
    }

    dbRoom.updated_at = Math.floor(Date.now() / 1000);
    await this.gameRepository.save(dbRoom);

    await client.join(roomId);

    const game = this.games.get(roomId);

    client.to(roomId).emit('player-joined', {
      roomId,
      playerId: userId,
    });

    return {
      success: true,
      room: activeRoom,
      fen: game?.fen() ?? new Chess().fen(),
      roomId,
    };
  }

  async makeMove(
    client: AuthenticatedSocket,
    server: Server,
    payload: MovePayload,
  ): Promise<{ success: boolean }> {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const room = this.rooms.get(payload.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.started) {
      throw new BadRequestException('Waiting for opponent');
    }

    if (room.gameOver) {
      throw new BadRequestException('Game already finished');
    }

    const game = this.games.get(payload.roomId);

    if (!game) {
      throw new NotFoundException('Game state not found');
    }

    const isWhite = room.whitePlayerId === userId;
    const isBlack = room.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new UnauthorizedException('You are not part of this game');
    }

    if (room.currentTurn === 'w' && !isWhite) {
      throw new BadRequestException('Not your turn');
    }

    if (room.currentTurn === 'b' && !isBlack) {
      throw new BadRequestException('Not your turn');
    }

    const move = game.move({
      from: payload.from,
      to: payload.to,
      promotion: payload.promotion,
    });

    if (!move) {
      throw new BadRequestException('Illegal move');
    }

    await this.saveMoveToDatabase(payload.roomId, move.san);

    room.currentTurn = game.turn();

    const isOver = game.isGameOver();

    if (isOver) {
      room.gameOver = true;
      await this.updateGameResult(payload.roomId, game);
    }

    server.to(payload.roomId).emit('move-made', {
      move,
      fen: game.fen(),
      turn: game.turn(),
      check: game.inCheck(),
      checkmate: game.isCheckmate(),
      draw: game.isDraw(),
      gameOver: isOver,
    });

    return {
      success: true,
    };
  }

  private async saveMoveToDatabase(
    roomId: string,
    moveSan: string,
  ): Promise<void> {
    const dbRoom = await this.gameRepository.findOne({
      where: { id: roomId },
    });

    if (!dbRoom) return;

    const currentMoves = dbRoom.moves || [];
    currentMoves.push(moveSan);
    dbRoom.moves = currentMoves;
    dbRoom.updated_at = Math.floor(Date.now() / 1000);
    await this.gameRepository.save(dbRoom);
  }

  private async updateGameResult(roomId: string, game: Chess): Promise<void> {
    const dbRoom = await this.gameRepository.findOne({
      where: { id: roomId },
      relations: {
        white_player: true,
        black_player: true,
      },
    });

    if (!dbRoom) return;

    dbRoom.status = GameStatus.FINISHED;
    dbRoom.ended_at = Math.floor(Date.now() / 1000);

    if (game.isCheckmate()) {
      const losingColor = game.turn();
      if (losingColor === 'w') {
        dbRoom.winner = dbRoom.black_player;
        dbRoom.result = GameResult.BLACK;
      } else {
        dbRoom.winner = dbRoom.white_player;
        dbRoom.result = GameResult.WHITE;
      }
    } else {
      dbRoom.result = GameResult.DRAW;
    }

    dbRoom.updated_at = Math.floor(Date.now() / 1000);
    await this.gameRepository.save(dbRoom);
  }

  async resign(
    client: AuthenticatedSocket,
    server: Server,
    roomId: string,
  ): Promise<{ success: boolean }> {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.started) {
      throw new BadRequestException('Game not started');
    }

    if (room.gameOver) {
      throw new BadRequestException('Game already finished');
    }

    const isWhite = room.whitePlayerId === userId;
    const isBlack = room.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new UnauthorizedException('You are not part of this game');
    }

    room.gameOver = true;

    const dbRoom = await this.gameRepository.findOne({
      where: { id: roomId },
      relations: {
        white_player: true,
        black_player: true,
      },
    });

    if (dbRoom) {
      dbRoom.status = GameStatus.FINISHED;
      dbRoom.ended_at = Math.floor(Date.now() / 1000);

      if (isWhite) {
        dbRoom.winner = dbRoom.black_player;
        dbRoom.result = GameResult.BLACK;
      } else {
        dbRoom.winner = dbRoom.white_player;
        dbRoom.result = GameResult.WHITE;
      }

      dbRoom.updated_at = Math.floor(Date.now() / 1000);
      await this.gameRepository.save(dbRoom);
    }

    server.to(roomId).emit('game-over', {
      result: isWhite ? GameResult.BLACK : GameResult.WHITE,
      reason: 'resignation',
      winnerId: isWhite ? room.blackPlayerId : room.whitePlayerId,
    });

    return { success: true };
  }

  offerDraw(client: AuthenticatedSocket, roomId: string) {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.started) {
      throw new BadRequestException('Game not started');
    }

    if (room.gameOver) {
      throw new BadRequestException('Game already finished');
    }

    const isWhite = room.whitePlayerId === userId;
    const isBlack = room.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new UnauthorizedException('You are not part of this game');
    }

    client.to(roomId).emit('draw-offered', {
      roomId,
      offeredById: userId,
    });

    return { success: true };
  }

  async acceptDraw(
    client: AuthenticatedSocket,
    server: Server,
    roomId: string,
  ): Promise<{ success: boolean }> {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.started) {
      throw new BadRequestException('Game not started');
    }

    if (room.gameOver) {
      throw new BadRequestException('Game already finished');
    }

    const isWhite = room.whitePlayerId === userId;
    const isBlack = room.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new UnauthorizedException('You are not part of this game');
    }

    room.gameOver = true;

    const dbRoom = await this.gameRepository.findOne({
      where: { id: roomId },
    });

    if (dbRoom) {
      dbRoom.status = GameStatus.FINISHED;
      dbRoom.result = GameResult.DRAW;
      dbRoom.ended_at = Math.floor(Date.now() / 1000);
      dbRoom.updated_at = Math.floor(Date.now() / 1000);
      await this.gameRepository.save(dbRoom);
    }

    server.to(roomId).emit('game-over', {
      result: GameResult.DRAW,
      reason: 'draw-agreement',
    });

    return { success: true };
  }

  declineDraw(
    client: AuthenticatedSocket,
    roomId: string,
  ): { success: boolean } {
    const userId = client.data.user?.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!room.started) {
      throw new BadRequestException('Game not started');
    }

    if (room.gameOver) {
      throw new BadRequestException('Game already finished');
    }

    const isWhite = room.whitePlayerId === userId;
    const isBlack = room.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new UnauthorizedException('You are not part of this game');
    }

    client.to(roomId).emit('draw-declined', {
      roomId,
      declinedById: userId,
    });

    return { success: true };
  }

  getRoomState(roomId: string) {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const game = this.games.get(roomId);

    return {
      room,
      fen: game?.fen(),
      turn: game?.turn(),
      check: game?.inCheck(),
      checkmate: game?.isCheckmate(),
      draw: game?.isDraw(),
      gameOver: game?.isGameOver(),
    };
  }
}
