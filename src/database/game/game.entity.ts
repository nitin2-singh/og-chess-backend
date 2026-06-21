import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum GameStatus {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

export enum GameResult {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
  DRAW = 'DRAW',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    length: 10,
  })
  room_code: string;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'white_player_id' })
  white_player: User;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'black_player_id' })
  black_player: User;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'winner_id' })
  winner: User;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GameResult,
    nullable: true,
  })
  result: GameResult;

  @Column({
    default: 0,
    type: 'bigint',
  })
  started_at: number;

  @Column({
    default: 0,
    type: 'bigint',
  })
  ended_at: number;

  @Column({
    default: 0,
    type: 'bigint',
  })
  created_at: number;

  @Column({ default: 0, type: 'bigint' })
  updated_at: number;
}
