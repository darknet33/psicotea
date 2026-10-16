import {
  AttendanceStatus,
  EnrollmentStatus,
  EnrollmentType,
  ReportPeriod,
  ReportType,
} from '@prisma/client';

/**
 * Datos del tutor principal que un padre puede ver en la página pública.
 * Deliberadamente no incluye `email` ni `carnet` del tutor.
 */
export interface PublicPrimaryTutorDto {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  address: string | null;
}

/**
 * Inscripción del niño con su saldo. Se expone porque el padre necesita saber
 * qué pagó y qué debe.
 */
export interface PublicEnrollmentDto {
  id: number;
  type: EnrollmentType | null;
  startDate: string;
  endDate: string | null;
  status: EnrollmentStatus;
  amount: number;
  totalPaid: number;
  balance: number;
  areas: string[];
}

/**
 * Registro de asistencia del niño.
 */
export interface PublicAttendanceDto {
  date: string;
  status: AttendanceStatus;
  notes: string | null;
}

/**
 * Actividad registrada por un especialista.
 */
export interface PublicActivityDto {
  date: string;
  title: string;
  description: string | null;
}

export interface PublicAttachmentDto {
  name: string;
  fileUrl: string;
  mimeType: string | null;
}

/**
 * Informe publicado del niño. El dueño decidió exponer el `content` y el
 * `summary` en el portal público (ver `public-child-portal-enhancement`).
 */
export interface PublicReportDto {
  id: number;
  title: string;
  type: ReportType;
  reportPeriod: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  content: string;
  summary: string | null;
  attachments: PublicAttachmentDto[];
}

/**
 * Respuesta de `GET /public/children/credential/:code`.
 *
 * Esta interfaz es la lista blanca de lo público. El servicio construye el
 * objeto con un `select` de Prisma que trae únicamente estos campos, así que
 * un campo nuevo que se agregue a `Child` no aparece aquí por accidente.
 */
export interface PublicChildProfileDto {
  name: string;
  lastName: string;
  /**
   * Carnet del niño. Se incluye porque quien abre esta página acaba de
   * escanear la credencial que ya lo lleva impreso, así que no agrega
   * exposición. Facilita que el padre confirme que la credencial es del niño
   * correcto antes de entregar datos de contacto.
   */
  carnet: string;
  /** Edad en años, calculada en el backend a partir de dateOfBirth. */
  age: number;
  photoUrl: string;
  /** Diagnóstico del niño. Expuesto con el QR por decisión del dueño. */
  diagnostico: string;
  primaryTutor: PublicPrimaryTutorDto | null;
  enrollments: PublicEnrollmentDto[];
  attendances: PublicAttendanceDto[];
  activities: PublicActivityDto[];
  reports: PublicReportDto[];
}
