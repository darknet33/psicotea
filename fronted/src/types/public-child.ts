/**
 * Tipos de la página pública de consulta para padres.
 *
 * Reflejan exactamente `PublicChildProfileDto` del backend
 * (`backend/src/public/dto/public-child-profile.dto.ts`).
 *
 * El dueño decidió exponer el diagnóstico y el contenido de los informes a
 * quien tenga el QR de la credencial (ver change
 * `public-child-portal-enhancement`). Aun así, siguen siendo una lista blanca:
 * el token, el carnet y el email del tutor nunca llegan al cliente.
 */

/** Tutor principal que el padre puede contactar. Sin `carnet` ni `email`. */
export interface PublicPrimaryTutor {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

export type PublicEnrollmentType =
  | "MENSUAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

export type PublicEnrollmentStatus = "ACTIVO" | "INACTIVO" | "RETIRADO";

/** Inscripción del niño con su saldo. */
export interface PublicEnrollment {
  id: number;
  type: PublicEnrollmentType | null;
  startDate: string;
  endDate: string | null;
  status: PublicEnrollmentStatus;
  amount: number;
  totalPaid: number;
  balance: number;
  areas: string[];
}

export type PublicAttendanceStatus =
  | "PRESENTE"
  | "AUSENTE"
  | "JUSTIFICADO";

export interface PublicAttendance {
  date: string;
  status: PublicAttendanceStatus;
  notes: string | null;
}

export interface PublicActivity {
  date: string;
  title: string;
  description: string | null;
}

export interface PublicAttachment {
  name: string;
  fileUrl: string;
  mimeType: string | null;
}

export type PublicReportType = "EVALUACION" | "EVOLUTIVO" | "PERIODICO";

export type PublicReportPeriod = "NINGUNO" | "INICIO" | "MEDIADOS" | "FIN";

/** Informe publicado con su contenido clínico y adjuntos. */
export interface PublicReport {
  id: number;
  title: string;
  type: PublicReportType;
  reportPeriod: PublicReportPeriod;
  periodStart: string;
  periodEnd: string;
  content: string;
  summary: string | null;
  attachments: PublicAttachment[];
}

export interface PublicChildProfile {
  name: string;
  lastName: string;
  /** Carnet del niño; viene impreso en la credencial escaneada. */
  carnet: string;
  /** Edad en años, calculada en el backend. */
  age: number;
  photoUrl: string;
  diagnostico: string;
  /** `null` cuando el niño no tiene tutor marcado como principal. */
  primaryTutor: PublicPrimaryTutor | null;
  enrollments: PublicEnrollment[];
  attendances: PublicAttendance[];
  activities: PublicActivity[];
  reports: PublicReport[];
}
