import { api } from "@/lib/axios";
import type {
  AgendaEntry,
  EvolutionNote,
  EvolutionNoteInput,
  QueryAgenda,
  QueryEvolution,
  QueryPlans,
  TreatmentPlan,
  TreatmentPlanInput,
  TreatmentPlanItem,
  TreatmentPlanItemInput,
} from "@/types/planning";

export async function listPlans(query: QueryPlans = {}): Promise<TreatmentPlan[]> {
  const { data } = await api.get<TreatmentPlan[]>("/planning/plans", { params: query });
  return data;
}

export async function getPlan(id: number): Promise<TreatmentPlan> {
  const { data } = await api.get<TreatmentPlan>(`/planning/plans/${id}`);
  return data;
}

export async function createPlan(input: TreatmentPlanInput): Promise<TreatmentPlan> {
  const { data } = await api.post<TreatmentPlan>("/planning/plans", input);
  return data;
}

export async function updatePlan(
  id: number,
  input: Partial<TreatmentPlanInput> & { isActive?: boolean },
): Promise<TreatmentPlan> {
  const { data } = await api.patch<TreatmentPlan>(`/planning/plans/${id}`, input);
  return data;
}

export async function removePlan(id: number): Promise<void> {
  await api.delete(`/planning/plans/${id}`);
}

export async function createPlanItem(
  planId: number,
  input: TreatmentPlanItemInput,
): Promise<TreatmentPlanItem> {
  const { data } = await api.post<TreatmentPlanItem>(
    `/planning/plans/${planId}/items`,
    input,
  );
  return data;
}

export async function updatePlanItem(
  planId: number,
  itemId: number,
  input: Partial<TreatmentPlanItemInput>,
): Promise<TreatmentPlanItem> {
  const { data } = await api.patch<TreatmentPlanItem>(
    `/planning/plans/${planId}/items/${itemId}`,
    input,
  );
  return data;
}

export async function deletePlanItem(planId: number, itemId: number): Promise<void> {
  await api.delete(`/planning/plans/${planId}/items/${itemId}`);
}

export async function getAgenda(query: QueryAgenda = {}): Promise<AgendaEntry[]> {
  const { data } = await api.get<AgendaEntry[]>("/planning/agenda", { params: query });
  return data;
}

export async function listEvolution(
  query: QueryEvolution = {},
): Promise<EvolutionNote[]> {
  const { data } = await api.get<EvolutionNote[]>("/planning/evolution", {
    params: query,
  });
  return data;
}

export async function createEvolution(
  input: EvolutionNoteInput,
): Promise<EvolutionNote> {
  const { data } = await api.post<EvolutionNote>("/planning/evolution", input);
  return data;
}

export async function updateEvolution(
  id: number,
  input: Partial<EvolutionNoteInput>,
): Promise<EvolutionNote> {
  const { data } = await api.patch<EvolutionNote>(`/planning/evolution/${id}`, input);
  return data;
}

export async function deleteEvolution(id: number): Promise<void> {
  await api.delete(`/planning/evolution/${id}`);
}
