import type { Payment, PaymentMethod } from "@/types/payment";

export const ENROLLMENT_STATUSES = ["ACTIVO", "INACTIVO", "RETIRADO"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

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
  facturado: number;
  pagado: number;
  saldo: number;
}

export interface Enrollment {
  id: number;
  childId: number;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  status: EnrollmentStatus;
  monthlyFee: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  child?: EnrollmentChild;
  scheduleDays?: EnrollmentScheduleDay[];
  areas?: EnrollmentArea[];
  payments?: Payment[];
  facturado?: number;
  pagado?: number;
  saldo?: number;
}

export interface EnrollmentGroup {
  child: EnrollmentChild;
  totals: EnrollmentTotals;
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
  method: PaymentMethod;
  periodStart: string;
  periodEnd: string;
  reference?: string;
  description?: string;
}

export interface EnrollmentInput {
  childId: number;
  startDate: string;
  durationDays: number;
  status?: EnrollmentStatus;
  monthlyFee: number;
  notes?: string;
  areaIds?: number[];
  scheduleDays?: ScheduleDay[];
  initialPayment?: InitialPaymentInput;
}

export interface EnrollmentPrefill {
  enrollmentId: number;
  monthlyFee: number;
  startDate: string;
  areaIds: number[];
  scheduleDays: ScheduleDay[];
}
