import { Role } from '@prisma/client';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export const ROOM_BY_ROLE: Record<Role, string> = {
  ADMIN: 'admin',
  ESPECIALISTA: 'especialista',
  PERSONAL_ADMINISTRATIVO: 'personal',
};

export function roomsForRoles(roles: Role[]): string[] {
  return roles.map((role) => ROOM_BY_ROLE[role]);
}
