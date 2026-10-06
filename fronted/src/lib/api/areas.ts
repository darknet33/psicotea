import { api } from "@/lib/axios";
import type { Area, AreaInput } from "@/types/area";

export async function listAreas(includeInactive = false): Promise<Area[]> {
  const { data } = await api.get<Area[]>("/areas", {
    params: { includeInactive },
  });
  return data;
}

export async function createArea(input: AreaInput): Promise<Area> {
  const { data } = await api.post<Area>("/areas", input);
  return data;
}

export async function updateArea(
  id: number,
  input: Partial<AreaInput> & { isActive?: boolean },
): Promise<Area> {
  const { data } = await api.patch<Area>(`/areas/${id}`, input);
  return data;
}
