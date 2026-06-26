import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/database/user/user.entity';
import { Game } from 'src/database/game/game.entity';

interface LeaderboardRawRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  wins: string;
}

interface CountRawRow {
  count: string;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getLeaderboard(page: number, limit: number, search: string) {
    const offset = (page - 1) * limit;

    // 1. Get raw leaderboard records
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoin(Game, 'game', 'game.winner_id = user.id')
      .select('user.id', 'id')
      .addSelect('user.first_name', 'first_name')
      .addSelect('user.last_name', 'last_name')
      .addSelect('user.email', 'email')
      .addSelect('COUNT(game.id)', 'wins')
      .groupBy('user.id')
      .orderBy('wins', 'DESC')
      .addOrderBy('user.first_name', 'ASC');

    if (search) {
      qb.where(
        '(LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    qb.offset(offset).limit(limit);

    // Cast raw results from any to unknown to target interface to satisfy ESLint type safety rules
    const rawResults =
      (await qb.getRawMany()) as unknown as LeaderboardRawRow[];

    // 2. Count total records
    const countQb = this.userRepository
      .createQueryBuilder('user')
      .select('COUNT(DISTINCT user.id)', 'count');

    if (search) {
      countQb.where(
        '(LOWER(user.first_name) LIKE LOWER(:search) OR LOWER(user.last_name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const countResult = (await countQb.getRawOne()) as unknown as
      | CountRawRow
      | undefined;
    const total = parseInt(countResult?.count || '0', 10);

    const data = rawResults.map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      wins: parseInt(row.wins || '0', 10),
    }));

    return {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      data,
    };
  }
}
