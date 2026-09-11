export const SEX_OPTIONS = ["M", "F", "Masculino", "Femenino"] as const;

export interface ChildSpecialist {
  id: number;
  user: {
    id: number;
    name: string;
    lastName: string;
  };
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
  parentName: string;
  parentLastName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail?: string | null;
  parentCarnet: string;
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
  parentName: string;
  parentLastName: string;
  parentRelationship: string;
  parentPhone: string;
  parentEmail?: string;
  parentCarnet: string;
  specialistId?: number;
}

export interface QueryChildren {
  search?: string;
  isActive?: boolean;
}