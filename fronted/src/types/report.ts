/** Tipos de informe. Espejo de `ReportType` (Prisma). */
export const REPORT_TYPES = ["EVALUACION", "EVOLUTIVO", "PERIODICO"] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  EVALUACION: "Evaluación (al ingreso)",
  EVOLUTIVO: "Evolutivo",
  PERIODICO: "Periódico",
};

/** Momento del año para los informes periódicos. Espejo de `ReportPeriod`. */
export const REPORT_PERIODS = ["NINGUNO", "INICIO", "MEDIADOS", "FIN"] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  NINGUNO: "Sin período específico",
  INICIO: "Principios de año",
  MEDIADOS: "Mediados de año",
  FIN: "Finales de año",
};

export interface ReportChild {
  id: number;
  name: string;
  lastName: string;
  carnet: string;
  dateOfBirth: string;
}

/** Autor del informe: es un `User` con rol ESPECIALISTA. */
export interface ReportAuthor {
  id: number;
  name: string;
  lastName: string;
  email: string;
}

export interface ReportAttachment {
  id: number;
  reportId: number;
  name: string;
  fileUrl: string;
  mimeType: string | null;
  createdAt: string;
}

export interface Report {
  id: number;
  childId: number;
  specialistId: number;
  title: string;
  content: string;
  type: ReportType;
  reportPeriod: ReportPeriod;
  summary: string | null;
  periodStart: string;
  periodEnd: string;
  isDraft: boolean;
  visibilityToParents: boolean;
  createdAt: string;
  updatedAt: string;
  child: ReportChild;
  specialist: ReportAuthor;
  attachments: ReportAttachment[];
}

export interface ReportInput {
  childId: number;
  specialistId?: number;
  title: string;
  content: string;
  type: ReportType;
  reportPeriod: ReportPeriod;
  summary?: string;
  periodStart: string;
  periodEnd: string;
  isDraft?: boolean;
  visibilityToParents?: boolean;
}

export interface QueryReports {
  childId?: number;
  specialistId?: number;
  type?: ReportType;
  from?: string;
  to?: string;
  includeDrafts?: boolean;
}

export interface EvolutionDraft {
  content: string;
  count: number;
}
