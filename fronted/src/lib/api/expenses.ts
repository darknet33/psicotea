import { api } from "@/lib/axios";
import type {
  Expense,
  ExpenseCategory,
  ExpenseCategoryInput,
  ExpenseInput,
  ExpenseQuery,
  ExpenseTotals,
} from "@/types/expense";

export async function listCategories(
  includeInactive = false,
): Promise<ExpenseCategory[]> {
  const { data } = await api.get<ExpenseCategory[]>("/expenses/categories", {
    params: { includeInactive },
  });
  return data;
}

export async function createCategory(
  input: ExpenseCategoryInput,
): Promise<ExpenseCategory> {
  const { data } = await api.post<ExpenseCategory>(
    "/expenses/categories",
    input,
  );
  return data;
}

export async function updateCategory(
  id: number,
  input: Partial<ExpenseCategoryInput> & { isActive?: boolean },
): Promise<ExpenseCategory> {
  const { data } = await api.patch<ExpenseCategory>(
    `/expenses/categories/${id}`,
    input,
  );
  return data;
}

export async function listExpenses(query: ExpenseQuery = {}): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>("/expenses", { params: query });
  return data;
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data } = await api.post<Expense>("/expenses", input);
  return data;
}

export async function updateExpense(
  id: number,
  input: Partial<ExpenseInput>,
): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/expenses/${id}`, input);
  return data;
}

export async function getExpenseTotals(
  query: ExpenseQuery = {},
): Promise<ExpenseTotals> {
  const { data } = await api.get<ExpenseTotals>("/expenses/totals", {
    params: query,
  });
  return data;
}
