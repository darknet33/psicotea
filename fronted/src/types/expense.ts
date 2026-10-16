export interface ExpenseCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryInput {
  name: string;
  description?: string;
  color?: string;
}

export interface Expense {
  id: number;
  categoryId: number;
  amount: number;
  date: string;
  description: string | null;
  receiptUrl: string | null;
  createdById: number;
  category: Pick<ExpenseCategory, "id" | "name" | "color">;
  createdBy: { id: number; name: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  categoryId: number;
  amount: number;
  date: string;
  description?: string;
  receiptUrl?: string;
}

export interface ExpenseQuery {
  categoryId?: number;
  createdById?: number;
  from?: string;
  to?: string;
  search?: string;
}

export interface ExpenseTotals {
  periodTotal: number;
  todayTotal: number;
  byCategory: Array<{
    categoryId: number;
    name: string;
    color: string | null;
    total: number;
  }>;
}
