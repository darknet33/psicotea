import { Request } from 'express';
import { Role } from '@prisma/client';

export interface RequestUser {
  id: number;
  email: string;
  name: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

export interface RefreshTokenRequest extends Request {
  user: RequestUser & { refreshTokenId: number };
}
