import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EventsGateway } from './events.gateway';
import { NotificationPayload, roomsForRoles } from './realtime.constants';

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: EventsGateway) {}

  notifyUser(userId: number, payload: NotificationPayload) {
    this.gateway.notifyUser(userId, payload);
  }

  broadcastToAdmins(event: string, data: unknown) {
    this.gateway.broadcastToAdmins(event, data);
  }

  broadcastToRoles(roles: Role[], event: string, data: unknown) {
    this.gateway.emitToRooms(roomsForRoles(roles), event, data);
  }

  emitToRooms(rooms: string[], event: string, data: unknown) {
    this.gateway.emitToRooms(rooms, event, data);
  }
}
