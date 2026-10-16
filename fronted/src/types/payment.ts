import type { EnrollmentStatus, EnrollmentType } from "@/types/enrollment";

export const PAYMENT_METHODS = ["EFECTIVO", "QR", "TRANSFERENCIA"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentChild {
  id: number;
  name: string;
  lastName: string;
}

/** Aplicación de un pago a una inscripción concreta. */
export interface PaymentAllocationEnrollment {
  id: number;
  type: EnrollmentType | null;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus;
  amount: number;
}

export interface PaymentAllocation {
  id: number;
  paymentId: number;
  enrollmentId: number;
  amount: number;
  createdAt: string;
  enrollment?: PaymentAllocationEnrollment;
}

export interface Payment {
  id: number;
  childId: number;
  /** Inscripción principal de compatibilidad, derivada de las allocations. */
  enrollmentId?: number | null;
  amount: number;
  /** Fecha en que se recibió el dinero, independiente del período cubierto. */
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  description?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt?: string;
  child?: PaymentChild;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocationInput {
  enrollmentId: number;
  amount: number;
}

export interface PaymentInput {
  childId: number;
  enrollmentId?: number;
  allocations?: PaymentAllocationInput[];
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
}

export interface QueryPayments {
  childId?: number;
  periodStart?: string;
  periodEnd?: string;
}

/** Obligación económica pendiente de una inscripción. */
export interface EnrollmentDebtItem {
  enrollmentId: number;
  type: EnrollmentType | null;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus;
  amount: number;
  pagado: number;
  saldo: number;
  vigente: boolean;
}

/** Deudas de un niño, separando la inscripción vigente de las anteriores. */
export interface PendingPayment {
  child: PaymentChild;
  active: EnrollmentDebtItem | null;
  previousDebts: EnrollmentDebtItem[];
  totalDue: number;
}
