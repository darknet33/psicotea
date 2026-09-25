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
  carnet: string;
  isPrimary: boolean;
}

export interface ChildTutorInput {
  name: string;
  lastName: string;
  relationship: string;
  phone: string;
  email?: string;
  carnet: string;
  isPrimary: boolean;
}

export interface Child {
  id: number;
  name: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  photo?: string | null;
  enrollmentDate: string;
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
  photo?: string;
  enrollmentDate: string;
  isActive?: boolean;
  tutors: ChildTutorInput[];
  specialistId?: number;
}

export interface QueryChildren {
  search?: string;
  isActive?: boolean;
}