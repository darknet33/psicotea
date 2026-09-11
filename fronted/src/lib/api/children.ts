import { api } from "@/lib/axios";
import type { Child, ChildInput, QueryChildren } from "@/types/child";
import type { Enrollment } from "@/types/enrollment";
import type { Payment } from "@/types/payment";

export interface ChildDetail extends Child {
  enrollments: Enrollment[];
  payments: Payment[];
}

export async function listChildren(query: QueryChildren = {}): Promise<Child[]> {
  const { data } = await api.get<Child[]>("/children", { params: query });
  return data;
}

export async function getChild(id: number): Promise<ChildDetail> {
  const { data } = await api.get<ChildDetail>(`/children/${id}`);
  return data;
}

export async function createChild(input: ChildInput): Promise<Child> {
  const { data } = await api.post<Child>("/children", input);
  return data;
}

export async function updateChild(id: number, input: Partial<ChildInput>): Promise<Child> {
  const { data } = await api.patch<Child>(`/children/${id}`, input);
  return data;
}

export async function removeChild(id: number): Promise<void> {
  await api.delete(`/children/${id}`);
}