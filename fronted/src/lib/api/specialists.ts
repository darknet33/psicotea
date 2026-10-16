import { api } from "@/lib/axios";
import type {
  QuerySpecialists,
  Specialist,
  SpecialistChild,
  SpecialistInput,
  SpecialistPayment,
  SpecialistPaymentInput,
  SpecialistPaymentPeriod,
  SpecialistScheduleDay,
  SpecialistScheduleInput,
} from "@/types/specialist";

export async function listSpecialists(
  query: QuerySpecialists = {},
): Promise<Specialist[]> {
  const { data } = await api.get<Specialist[]>("/specialists", { params: query });
  return data;
}

export async function getSpecialist(id: number): Promise<Specialist> {
  const { data } = await api.get<Specialist>(`/specialists/${id}`);
  return data;
}

export async function createSpecialist(input: SpecialistInput): Promise<Specialist> {
  const { data } = await api.post<Specialist>("/specialists", input);
  return data;
}

export async function updateSpecialist(
  id: number,
  input: Partial<SpecialistInput> & { isActive?: boolean },
): Promise<Specialist> {
  const { data } = await api.patch<Specialist>(`/specialists/${id}`, input);
  return data;
}

export async function getSpecialistSchedule(
  id: number,
): Promise<SpecialistScheduleDay[]> {
  const { data } = await api.get<SpecialistScheduleDay[]>(
    `/specialists/${id}/schedule`,
  );
  return data;
}

export async function replaceSpecialistSchedule(
  id: number,
  days: SpecialistScheduleInput[],
): Promise<SpecialistScheduleDay[]> {
  const { data } = await api.put<SpecialistScheduleDay[]>(
    `/specialists/${id}/schedule`,
    { days },
  );
  return data;
}

export async function replaceSpecialistAreas(
  id: number,
  areaIds: number[],
): Promise<Specialist> {
  const { data } = await api.put<Specialist>(`/specialists/${id}/areas`, {
    areaIds,
  });
  return data;
}

export async function replaceSpecialistChildren(
  id: number,
  childIds: number[],
): Promise<Specialist> {
  const { data } = await api.patch<Specialist>(`/specialists/${id}/children`, {
    childIds,
  });
  return data;
}

export async function getSpecialistChildren(id: number): Promise<SpecialistChild[]> {
  const specialist = await getSpecialist(id);
  return specialist.children ?? [];
}

export async function getSpecialistPaymentPeriods(
  id: number,
): Promise<SpecialistPaymentPeriod[]> {
  const { data } = await api.get<SpecialistPaymentPeriod[]>(
    `/specialists/${id}/payment-periods`,
  );
  return data;
}

export async function listSpecialistPayments(
  id: number,
): Promise<SpecialistPayment[]> {
  const { data } = await api.get<SpecialistPayment[]>(
    `/specialists/${id}/payments`,
  );
  return data;
}

export async function createSpecialistPayment(
  id: number,
  input: SpecialistPaymentInput,
): Promise<SpecialistPayment> {
  const { data } = await api.post<SpecialistPayment>(
    `/specialists/${id}/payments`,
    input,
  );
  return data;
}

export async function deleteSpecialistPayment(
  id: number,
  paymentId: number,
): Promise<void> {
  await api.delete(`/specialists/${id}/payments/${paymentId}`);
}
