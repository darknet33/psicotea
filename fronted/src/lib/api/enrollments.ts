import { api } from "@/lib/axios";
import type {
  Enrollment,
  EnrollmentInput,
  EnrollmentPrefill,
  ListEnrollmentsResponse,
  QueryEnrollments,
} from "@/types/enrollment";

export async function listEnrollments(
  query: QueryEnrollments = {},
): Promise<ListEnrollmentsResponse> {
  const { data } = await api.get<ListEnrollmentsResponse>("/enrollments", {
    params: query,
  });
  return data;
}

export async function getEnrollment(id: number): Promise<Enrollment> {
  const { data } = await api.get<Enrollment>(`/enrollments/${id}`);
  return data;
}

export async function listEnrollmentsByChild(childId: number): Promise<Enrollment[]> {
  const { data } = await api.get<Enrollment[]>(`/enrollments/child/${childId}`);
  return data;
}

export async function getEnrollmentPrefill(childId: number): Promise<EnrollmentPrefill> {
  const { data } = await api.get<EnrollmentPrefill>(
    `/enrollments/child/${childId}/prefill`,
  );
  return data;
}

export async function createEnrollment(input: EnrollmentInput): Promise<Enrollment> {
  const { data } = await api.post<Enrollment>("/enrollments", input);
  return data;
}

export async function updateEnrollment(
  id: number,
  input: Partial<EnrollmentInput>,
): Promise<Enrollment> {
  const { data } = await api.patch<Enrollment>(`/enrollments/${id}`, input);
  return data;
}
