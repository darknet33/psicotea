import type { Payment, PaymentMethod } from "@/types/payment";

export const ENROLLMENT_STATUSES = ["ACTIVO", "INACTIVO", "RETIRADO"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ENROLLMENT_TYPES = [
  "MENSUAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
] as const;

export type EnrollmentType = (typeof ENROLLMENT_TYPES)[number];

export const ENROLLMENT_TYPE_LABELS: Record<EnrollmentType, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

/**
 * Duración en días corridos por tipo de inscripción. El backend la deriva y
 * persiste; el frontend solo la muestra. Debe coincidir con
 * `ENROLLMENT_DURATIONS` del backend.
 */
export const ENROLLMENT_TYPE_DAYS: Record<EnrollmentType, number> = {
  MENSUAL: 30,
  TRIMESTRAL: 90,
  SEMESTRAL: 180,
  ANUAL: 360,
};

export function enrollmentTypeLabel(type?: EnrollmentType | null): string {
  return type ? ENROLLMENT_TYPE_LABELS[type] : "Sin tipo";
}

export function enrollmentTypeDays(type?: EnrollmentType | null): number | null {
  return type ? ENROLLMENT_TYPE_DAYS[type] : null;
}

export const SHIFTS = ["TODO_DIA", "MANANA", "TARDE"] as const;

export type Shift = (typeof SHIFTS)[number];

export const SHIFT_LABELS: Record<Shift, string> = {
  TODO_DIA: "Todo el día",
  MANANA: "Mañana",
  TARDE: "Tarde",
};

export const WEEKDAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
] as const;

export const WEEKDAY_LABELS: Record<number, string> = Object.fromEntries(
  WEEKDAYS.map((day) => [day.value, day.label]),
);

export interface EnrollmentChild {
  id: number;
  name: string;
  lastName: string;
  photoUrl?: string | null;
  isActive: boolean;
}

export interface ScheduleDay {
  dayOfWeek: number;
  shift: Shift;
}

export interface EnrollmentScheduleDay extends ScheduleDay {
  id: number;
  enrollmentId: number;
}

export interface EnrollmentArea {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface EnrollmentTotals {
  /** Monto de la inscripción para el período completo. */
  total: number;
  /** Suma de las allocations de pagos aplicadas a la inscripción. */
  pagado: number;
  /** `total − pagado`. Positivo indica deuda. */
  saldo: number;
}

export interface Enrollment {
  id: number;
  childId: number;
  type: EnrollmentType | null;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  status: EnrollmentStatus;
  amount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  child?: EnrollmentChild;
  scheduleDays?: EnrollmentScheduleDay[];
  areas?: EnrollmentArea[];
  payments?: Payment[];
  /** Totales económicos calculados en el backend. */
  total: number;
  pagado: number;
  saldo: number;
  /** `true` cuando hoy cae dentro del rango y el estado es ACTIVO. */
  vigente: boolean;
}

export interface EnrollmentGroup {
  child: EnrollmentChild;
  totals: EnrollmentTotals;
  enrollments: Enrollment[];
}

/** Resumen económico del niño con su inscripción vigente y deudas anteriores. */
export interface EnrollmentSummary {
  childId: number;
  active: Enrollment | null;
  previousDebts: Enrollment[];
  enrollments: Enrollment[];
}

export interface ListEnrollmentsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListEnrollmentsResponse {
  groups: EnrollmentGroup[];
  meta: ListEnrollmentsMeta;
}

export interface QueryEnrollments {
  childId?: number;
  status?: EnrollmentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InitialPaymentInput {
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  periodStart: string;
  periodEnd: string;
  reference?: string;
  description?: string;
}

export interface EnrollmentInput {
  childId: number;
  type: EnrollmentType;
  startDate: string;
  amount: number;
  status?: EnrollmentStatus;
  notes?: string;
  areaIds?: number[];
  scheduleDays?: ScheduleDay[];
  initialPayment?: InitialPaymentInput;
}

export interface EnrollmentPrefill {
  enrollmentId: number;
  type: EnrollmentType | null;
  amount: number;
  startDate: string;
  areaIds: number[];
  scheduleDays: ScheduleDay[];
}
