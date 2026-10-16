import type { Area } from "@/types/area";
import type { PaymentMethod } from "@/types/payment";

/** Turnos predefinidos del especialista. Espejo de `SpecialistShift` (Prisma). */
export const SPECIALIST_SHIFTS = ["MANANA", "TARDE", "AMBOS"] as const;

export type SpecialistShift = (typeof SPECIALIST_SHIFTS)[number];

export const SPECIALIST_SHIFT_LABELS: Record<SpecialistShift, string> = {
  MANANA: "Mañana (09:00–12:30)",
  TARDE: "Tarde (14:00–17:30)",
  AMBOS: "Mañana y tarde",
};

/** Usuario asociado al perfil del especialista. */
export interface SpecialistUser {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

/** Día de atención: turno predefinido o rango horario personalizado. */
export interface SpecialistScheduleDay {
  id: number;
  specialistId: number;
  /** 0 = domingo ... 6 = sábado. */
  dayOfWeek: number;
  shift: SpecialistShift | null;
  startTime: string | null;
  endTime: string | null;
  label?: string;
}

/** Vínculo especialista–área que devuelve el backend (`areas: { area }[]`). */
export interface SpecialistAreaLink {
  id: number;
  specialistId: number;
  areaId: number;
  area: Area;
}

export interface SpecialistPayment {
  id: number;
  specialistId: number;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  method: PaymentMethod;
  notes: string | null;
  createdById: number;
  createdAt: string;
}

/** Mes de sueldo/honorarios con su estado de pago. */
export interface SpecialistPaymentPeriod {
  periodStart: string;
  periodEnd: string;
  label: string;
  isPaid: boolean;
  totalPaid: number;
}

export interface SpecialistChild {
  id: number;
  name: string;
  lastName: string;
  isActive: boolean;
}

export interface Specialist {
  id: number;
  userId: number;
  professionalId: string;
  specialty: string;
  licenseNumber: string | null;
  phone: string | null;
  address: string | null;
  entryDate: string;
  monthlySalary: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: SpecialistUser;
  areas: SpecialistAreaLink[];
  schedules: SpecialistScheduleDay[];
  children?: SpecialistChild[];
  payments?: SpecialistPayment[];
}

export interface SpecialistInput {
  userId: number;
  professionalId: string;
  specialty: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  entryDate?: string;
  monthlySalary?: number;
}

export interface SpecialistScheduleInput {
  dayOfWeek: number;
  shift?: SpecialistShift;
  startTime?: string;
  endTime?: string;
}

export interface SpecialistPaymentInput {
  amount: number;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  method: PaymentMethod;
  notes?: string;
}

export interface QuerySpecialists {
  includeInactive?: boolean;
  search?: string;
  areaId?: number;
}
