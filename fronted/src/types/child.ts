export const SEX_OPTIONS = ["Varón", "Mujer"] as const;

export interface ChildSpecialist {
  id: number;
  user: {
    id: number;
    name: string;
    lastName: string;
  };
}

export interface ChildTutor {
  id: number;
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  carnet: string;
  isPrimary: boolean;
}

export interface ChildTutorInput {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  carnet: string;
  isPrimary: boolean;
}

export interface Child {
  id: number;
  name: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  photoUrl: string;
  diagnostico: string;
  /** Documento de identidad del niño. Obligatorio y único en el sistema. */
  carnet: string;
  /**
   * Token firmado de la credencial. El backend lo genera siempre; el cliente
   * solo lo lee, nunca lo escribe.
   */
  credentialCode: string;
  isActive: boolean;
  tutors: ChildTutor[];
  specialistId?: number | null;
  specialist?: ChildSpecialist | null;
  createdAt: string;
}

export interface ChildInput {
  name: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  photoUrl: string;
  diagnostico: string;
  carnet: string;
  isActive?: boolean;
  tutors: ChildTutorInput[];
  specialistId?: number;
}

export interface QueryChildren {
  search?: string;
  isActive?: boolean;
}