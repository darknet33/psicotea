export const ENROLLMENT_STATUSES = ["ACTIVO", "INACTIVO", "RETIRADO"] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface EnrollmentChild {
  id: number;
  name: string;
  lastName: string;
  isActive: boolean;
}

export interface Enrollment {
  id: number;
  childId: number;
  startDate: string;
  endDate?: string | null;
  status: EnrollmentStatus;
  monthlyFee: number;
  notes?: string | null;
  createdAt: string;
  child?: EnrollmentChild;
}

export interface EnrollmentInput {
  childId: number;
  startDate: string;
  endDate?: string;
  status?: EnrollmentStatus;
  monthlyFee: number;
  notes?: string;
}

export interface QueryEnrollments {
  childId?: number;
  status?: EnrollmentStatus;
}