import { api } from "@/lib/axios";
import type { Role, User } from "@/types/user";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  lastName: string;
  role: Role;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await api.post<User>("/users", input);
  return data;
}
