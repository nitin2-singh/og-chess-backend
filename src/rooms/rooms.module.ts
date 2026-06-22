import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/user/user.entity';
import { Game } from 'src/database/game/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Game])],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
