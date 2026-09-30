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

/** Registro de asistencia listado por fecha (`GET /attendance/by-date/:date`). */
export interface AttendanceByDateItem {
  id: number;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  child: { id: number; name: string; lastName: string; carnet: string };
  registeredBy: { id: number; name: string; lastName: string };
}

/**
 * Lista las asistencias registradas en una fecha concreta.
 *
 * @param date Fecha local en formato `AAAA-MM-DD` (hora local del navegador).
 */
export async function listAttendanceByDate(date: string): Promise<AttendanceByDateItem[]> {
  const { data } = await api.get<AttendanceByDateItem[]>(`/attendance/by-date/${date}`);
  return data;
}

/**
 * Días del mes (`AAAA-MM-DD`) que tienen al menos una asistencia registrada.
 * Lo usa el calendario para marcar con un punto los días con actividad.
 */
export async function listAttendanceDaysInMonth(
  year: number,
  month: number,
): Promise<string[]> {
  const { data } = await api.get<string[]>(`/attendance/days/${year}/${month}`);
  return data;
}
