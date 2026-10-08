export const PAYMENT_METHODS = ["EFECTIVO", "QR", "TRANSFERENCIA"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentChild {
  id: number;
  name: string;
  lastName: string;
}

export interface Payment {
  id: number;
  childId: number;
  enrollmentId?: number | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string | null;
  description?: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  child?: PaymentChild;
}

export interface PaymentInput {
  childId: number;
  enrollmentId?: number;
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

export interface PendingPaymentPeriod {
  child: PaymentChild;
  periods: string[];
  amountDue: number;
}