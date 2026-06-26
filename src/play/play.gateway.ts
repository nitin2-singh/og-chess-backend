// game.gateway.ts

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';
import { PlayService } from './play.service';
import { AuthenticatedSocket } from './dtos/socket.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PlayGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly playService: PlayService) {}

  async handleConnection(client: AuthenticatedSocket) {
    await this.playService.authenticate(client);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.playService.disconnect(client);
  }

  @SubscribeMessage('join-room')
  async joinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      return await this.playService.joinRoom(client, payload.roomId);
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error.message || 'Failed to join room',
        };
    }
  }

  @SubscribeMessage('move')
  async move(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    payload: {
      roomId: string;
      from: string;
      to: string;
      promotion?: string;
    },
  ) {
    try {
      return await this.playService.makeMove(client, this.server, payload);
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error.message || 'Illegal or invalid move',
        };
    }
  }

  @SubscribeMessage('resign')
  async resign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      return await this.playService.resign(client, this.server, payload.roomId);
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error.message || 'Failed to resign',
        };
    }
  }

  @SubscribeMessage('offer-draw')
  offerDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      return this.playService.offerDraw(client, payload.roomId);
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error?.message || 'Failed to offer draw',
        };
    }
  }

  @SubscribeMessage('accept-draw')
  async acceptDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      return await this.playService.acceptDraw(
        client,
        this.server,
        payload.roomId,
      );
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error.message || 'Failed to accept draw',
        };
    }
  }

  @SubscribeMessage('decline-draw')
  declineDraw(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      return this.playService.declineDraw(client, payload.roomId);
    } catch (error) {
      if (error instanceof Error)
        return {
          status: 'error',
          message: error.message || 'Failed to decline draw',
        };
    }
  }
}
