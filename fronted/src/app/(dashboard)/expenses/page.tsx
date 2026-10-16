"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { ExpenseForm } from "@/components/forms/expense-form";
import {
  getExpenseTotals,
  listCategories,
  listExpenses,
} from "@/lib/api/expenses";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import type { Expense, ExpenseCategory, ExpenseTotals } from "@/types/expense";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [totals, setTotals] = useState<ExpenseTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const query = {
          categoryId: categoryId ? Number(categoryId) : undefined,
          from: from || undefined,
          to: to || undefined,
          search: search || undefined,
        };

        const [rows, totalsData] = await Promise.all([
          listExpenses(query),
          getExpenseTotals({
            categoryId: query.categoryId,
            from: query.from,
            to: query.to,
          }),
        ]);

        if (cancelled) return;
        setExpenses(rows);
        setTotals(totalsData);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, from, to, search, refreshKey]);

  const columns: DataTableColumn<Expense>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (item) => formatDate(item.date),
    },
    {
      key: "category",
      header: "Categoría",
      cell: (item) => (
        <span className="inline-flex items-center gap-2">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.category.color ?? "#94a3b8" }}
          />
          {item.category.name}
        </span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      cell: (item) =>
        item.description ? (
          item.description
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdBy",
      header: "Registró",
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.createdBy.name} {item.createdBy.lastName}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      className: "text-right",
      cell: (item) => (
        <span className="font-medium">{formatPrice(item.amount)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditing(item);
            setFormOpen(true);
          }}
        >
          Editar
        </Button>
      ),
    },
  ];

  return (
    <RoleBasedRoute allowedRoles={["ADMIN", "PERSONAL_ADMINISTRATIVO"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
            <p className="text-muted-foreground">
              Registro y control de gastos del centro por categoría.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/expenses/categories">
                <Tags className="size-4" />
                Categorías
              </Link>
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nuevo gasto
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total del período</p>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(totals?.periodTotal ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total de hoy</p>
            <p className="mt-1 text-2xl font-bold">
              {formatPrice(totals?.todayTotal ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Categorías con gastos</p>
            <p className="mt-1 text-2xl font-bold">
              {totals?.byCategory.length ?? 0}
            </p>
          </div>
        </div>

        {totals && totals.byCategory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {totals.byCategory.map((item) => (
              <Badge key={item.categoryId} variant="outline">
                <span
                  className="mr-1.5 size-2 rounded-full"
                  style={{ backgroundColor: item.color ?? "#94a3b8" }}
                />
                {item.name}: {formatPrice(item.total)}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="expense-filter-category" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="expense-filter-category"
              className={inputClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="expense-filter-from" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="expense-filter-from"
              type="date"
              className={inputClass}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="expense-filter-to" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="expense-filter-to"
              type="date"
              className={inputClass}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={expenses}
          rowKey={(item) => item.id}
          loading={loading}
          error={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por descripción..."
          emptyMessage="No hay gastos registrados para el filtro seleccionado"
        />

        <ExpenseForm
          open={formOpen}
          onOpenChange={setFormOpen}
          expense={editing}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </RoleBasedRoute>
  );
}
