import { api } from "@/lib/axios";
import type { Activity, ActivityInput, ActivityQuery } from "@/types/activity";

export async function listActivities(
  query: ActivityQuery = {},
): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>("/activities", { params: query });
  return data;
}

export async function createActivity(
  input: ActivityInput,
): Promise<Activity> {
  const { data } = await api.post<Activity>("/activities", input);
  return data;
}

export async function updateActivity(
  id: number,
  input: Partial<ActivityInput>,
): Promise<Activity> {
  const { data } = await api.patch<Activity>(`/activities/${id}`, input);
  return data;
}

export async function deleteActivity(id: number): Promise<void> {
  await api.delete(`/activities/${id}`);
}
