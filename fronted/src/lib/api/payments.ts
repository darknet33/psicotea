import { api } from "@/lib/axios";
import type {
  Payment,
  PaymentInput,
  PendingPaymentPeriod,
  QueryPayments,
} from "@/types/payment";

export async function listPayments(query: QueryPayments = {}): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/payments", { params: query });
  return data;
}

export async function getPayment(id: number): Promise<Payment> {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function listPaymentsByChild(childId: number): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>(`/payments/child/${childId}`);
  return data;
}

export async function listPendingPayments(childId?: number): Promise<PendingPaymentPeriod[]> {
  const { data } = await api.get<PendingPaymentPeriod[]>("/payments/pending", {
    params: childId !== undefined ? { childId } : {},
  });
  return data;
}

export async function createPayment(input: PaymentInput): Promise<Payment> {
  const { data } = await api.post<Payment>("/payments", input);
  return data;
}

export async function updatePayment(id: number, input: Partial<PaymentInput>): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}`, input);
  return data;
}