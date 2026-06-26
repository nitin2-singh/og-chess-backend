// play/types/socket-user.interface.ts

import { Socket } from 'socket.io';
import { JwtPayload } from 'src/stratergies/jwt-stratergies';

export interface SocketData {
  user?: JwtPayload;
}

export type AuthenticatedSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketData
>;

export interface MovePayload {
  roomId: string;
  from: string;
  to: string;
  promotion?: string;
}

export interface ActiveRoom {
  roomId: string;
  whitePlayerId?: string | null;
  blackPlayerId?: string | null;
  started: boolean;
  currentTurn: 'w' | 'b';
  gameOver: boolean;
}
