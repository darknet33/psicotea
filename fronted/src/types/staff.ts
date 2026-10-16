import type { Role } from "./user";

export interface Staff {
  id: number;
  userId: number;
  employeeId: string;
  position: string;
  department: string | null;
  hireDate: string;
  salary: number | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  user: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StaffInput {
  userId: number;
  employeeId: string;
  position: string;
  department?: string;
  hireDate: string;
  salary?: number;
  phone?: string;
  address?: string;
}
