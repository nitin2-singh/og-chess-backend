import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { JwtPayload } from 'src/stratergies/jwt-stratergies';
import { CreateRoomDto, GetRoomsDto } from './dtos/create-room.dto';
import { PaginatedRoomsDto, RoomResponseDto } from './dtos/room-response.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRoom(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.createRoom(user.sub, dto);
  }

  @Get()
  getRooms(
    @Query() query: GetRoomsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedRoomsDto> {
    return this.roomsService.getRooms(user.sub, query);
  }
}
