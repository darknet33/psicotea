import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { NotificationPayload, ROOM_BY_ROLE } from './realtime.constants';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server?: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        throw new Error('Token ausente');
      }

      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'access') {
        throw new Error('Tipo de token inválido');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Usuario inactivo o inexistente');
      }

      await client.join(`user:${user.id}`);
      await client.join(ROOM_BY_ROLE[user.role]);
      await client.join('all');

      client.data.userId = user.id;
      client.data.role = user.role;
    } catch (error) {
      this.logger.warn(
        `Conexión WebSocket rechazada: ${(error as Error).message}`,
      );
      client.emit('unauthorized', { message: 'No autorizado' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    client.data.userId = undefined;
    client.data.role = undefined;
  }

  notifyUser(userId: number, payload: NotificationPayload) {
    this.server
      ?.to(`user:${userId}`)
      .emit('notification', this.withTimestamp(payload));
  }

  broadcastToAdmins(event: string, data: unknown) {
    this.server?.to(ROOM_BY_ROLE[Role.ADMIN]).emit(event, data);
  }

  emitToRooms(rooms: string[], event: string, data: unknown) {
    if (!this.server || rooms.length === 0) {
      return;
    }
    this.server.to(rooms).emit(event, data);
  }

  private withTimestamp(payload: NotificationPayload): NotificationPayload {
    return {
      type: 'info',
      ...payload,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    const header = client.handshake.headers.authorization;
    const raw = auth?.token ?? header ?? null;

    if (!raw) {
      return null;
    }

    return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
  }
}
