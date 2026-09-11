export const ROLES = ["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"] as const;

export type Role = (typeof ROLES)[number];

export interface User {
  id: number;
  email: string;
  name: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface UpdateProfileInput {
  name?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}