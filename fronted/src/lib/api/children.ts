import { api, getValidationErrors } from "@/lib/axios";
import type { Child, ChildInput, QueryChildren } from "@/types/child";
import type { Enrollment } from "@/types/enrollment";
import type { Payment } from "@/types/payment";
import type { ChildFormServerError } from "@/components/forms/child-form";

export interface ChildDetail extends Child {
  enrollments: Enrollment[];
  payments: Payment[];
}

export async function listChildren(query: QueryChildren = {}): Promise<Child[]> {
  const { data } = await api.get<Child[]>("/children", { params: query });
  return data;
}

export async function getChildren(query: QueryChildren = {}): Promise<Child[]> {
  return listChildren(query);
}

export async function searchChildren(search: string): Promise<Child[]> {
  return listChildren({ search });
}

export async function getChild(id: number): Promise<ChildDetail> {
  const { data } = await api.get<ChildDetail>(`/children/${id}`);
  return data;
}

export async function createChild(input: ChildInput): Promise<Child> {
  const { data } = await api.post<Child>("/children", input);
  return data;
}

export async function updateChild(id: number, input: Partial<ChildInput>): Promise<Child> {
  const { data } = await api.patch<Child>(`/children/${id}`, input);
  return data;
}

export async function removeChild(id: number): Promise<void> {
  await api.delete(`/children/${id}`);
}

/**
 * Convierte el error de un 400 al guardar un niño en algo que el formulario
 * pueda mostrar junto al campo.
 *
 * El caso importante es el carnet duplicado: el backend lo detecta violando el
 * índice único y responde con un mensaje de texto plano, no con el formato
 * `{ campo, mensaje }` de `class-validator`. Sin esto el usuario solo vería un
 * toast genérico y no sabría qué corregir.
 *
 * Devuelve `null` si el error no es de validación, para que la página lo
 * muestre únicamente como toast.
 */
export function getChildSubmitError(error: unknown): ChildFormServerError | null {
  const validationErrors = getValidationErrors(error);
  if (validationErrors.length === 0) return null;

  const carnetError = validationErrors.find(
    (item) => item.field === "carnet" || /carnet/i.test(item.message),
  );

  if (carnetError) {
    return { field: "carnet", message: carnetError.message };
  }

  return { field: "root", message: validationErrors[0].message };
}