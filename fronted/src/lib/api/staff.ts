import { api } from "@/lib/axios";
import type { Staff, StaffInput } from "@/types/staff";

export async function listStaff(
  includeInactive = false,
  search?: string,
): Promise<Staff[]> {
  const { data } = await api.get<Staff[]>("/staff", {
    params: { includeInactive, search: search || undefined },
  });
  return data;
}

export async function createStaff(input: StaffInput): Promise<Staff> {
  const { data } = await api.post<Staff>("/staff", input);
  return data;
}

export async function updateStaff(
  id: number,
  input: Partial<StaffInput> & { isActive?: boolean },
): Promise<Staff> {
  const { data } = await api.patch<Staff>(`/staff/${id}`, input);
  return data;
}
