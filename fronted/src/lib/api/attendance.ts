import { api } from "@/lib/axios";

/** Estados posibles de una asistencia (espejo de `AttendanceStatus` en Prisma). */
export type AttendanceStatus = "PRESENTE" | "AUSENTE" | "JUSTIFICADO";

export interface ScanAttendanceResult {
  attendance: {
    id: number;
    childId: number;
    date: string;
    status: AttendanceStatus;
    registeredById: number;
    createdAt: string;
    updatedAt: string;
  };
  /** `true` si el registro se acaba de crear, `false` si ya existía hoy. */
  created: boolean;
  child: { id: number; name: string; lastName: string };
}

/**
 * Registra la asistencia del día a partir de la credencial escaneada.
 *
 * Es idempotente por niño y fecha: reescanear el mismo QR el mismo día no
 * duplica el registro, solo devuelve `created: false`.
 *
 * Acepta el token suelto o la URL completa del QR.
 */
export async function scanAttendance(code: string): Promise<ScanAttendanceResult> {
  const { data } = await api.post<ScanAttendanceResult>("/attendance/scan", { code });
  return data;
}
