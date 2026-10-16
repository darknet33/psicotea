import type { Area } from "@/types/area";

/** Frecuencia del plan. Espejo de `PlanFrequency` (Prisma). */
export const PLAN_FREQUENCIES = ["DAILY", "WEEKLY"] as const;

export type PlanFrequency = (typeof PLAN_FREQUENCIES)[number];

export const PLAN_FREQUENCY_LABELS: Record<PlanFrequency, string> = {
  DAILY: "Diario (todos los días)",
  WEEKLY: "Semanal (por día de la semana)",
};

export interface PlanChild {
  id: number;
  name: string;
  lastName: string;
  isActive: boolean;
}

export interface PlanSpecialist {
  id: number;
  user: { id: number; name: string; lastName: string };
}

export interface TreatmentPlanItem {
  id: number;
  planId: number;
  title: string;
  description: string | null;
  /** 0 = domingo ... 6 = sábado. `null` = aplica todos los días. */
  dayOfWeek: number | null;
  order: number;
}

export interface TreatmentPlan {
  id: number;
  childId: number;
  specialistId: number;
  areaId: number | null;
  frequency: PlanFrequency;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  child: PlanChild;
  area: Area | null;
  specialist: PlanSpecialist;
  items: TreatmentPlanItem[];
}

export interface TreatmentPlanInput {
  childId: number;
  specialistId?: number;
  areaId?: number;
  frequency?: PlanFrequency;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface TreatmentPlanItemInput {
  title: string;
  description?: string;
  dayOfWeek?: number;
  order?: number;
}

/** Entrada de la agenda: un ítem aplicable a una fecha concreta. */
export interface AgendaEntry {
  date: string;
  planId: number;
  childId: number;
  childName: string;
  areaId: number | null;
  areaName: string | null;
  itemId: number;
  title: string;
  description: string | null;
  completed: boolean;
}

export interface EvolutionNote {
  id: number;
  childId: number;
  specialistId: number;
  planId: number | null;
  planItemId: number | null;
  date: string;
  content: string;
  observation: string | null;
  createdAt: string;
  child: { id: number; name: string; lastName: string };
  planItem: { id: number; title: string } | null;
  specialist: { id: number; user: { id: number; name: string; lastName: string } };
}

export interface EvolutionNoteInput {
  childId: number;
  specialistId?: number;
  planId?: number;
  planItemId?: number;
  date: string;
  content: string;
  observation?: string;
}

export interface QueryPlans {
  childId?: number;
  specialistId?: number;
  includeInactive?: boolean;
}

export interface QueryAgenda {
  date?: string;
  from?: string;
  to?: string;
  specialistId?: number;
}

export interface QueryEvolution {
  childId?: number;
  specialistId?: number;
  from?: string;
  to?: string;
}
