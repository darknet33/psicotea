export interface Activity {
  id: number;
  childId: number;
  specialistId: number;
  date: string;
  title: string;
  description: string | null;
  duration: number | null;
  child: { id: number; name: string; lastName: string };
  specialist: { id: number; name: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityInput {
  childId: number;
  date: string;
  title: string;
  description?: string;
  duration?: number;
  specialistId?: number;
}

export interface ActivityQuery {
  childId?: number;
  specialistId?: number;
  from?: string;
  to?: string;
  search?: string;
  mine?: boolean;
}
