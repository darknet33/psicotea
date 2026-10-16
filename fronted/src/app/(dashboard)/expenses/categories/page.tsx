"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { CategoryForm } from "@/components/forms/category-form";
import { listCategories, updateCategory } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/axios";
import type { ExpenseCategory } from "@/types/expense";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await listCategories(includeInactive);
        if (cancelled) return;
        setCategories(data);
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
  }, [includeInactive, refreshKey]);

  async function toggleActive(category: ExpenseCategory) {
    try {
      setTogglingId(category.id);
      const updated = await updateCategory(category.id, {
        isActive: !category.isActive,
      });
      toast.success(
        updated.isActive ? "Categoría reactivada" : "Categoría desactivada",
      );
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<ExpenseCategory>[] = [
    {
      key: "name",
      header: "Categoría",
      cell: (item) => (
        <span className="inline-flex items-center gap-2 font-medium">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: item.color ?? "#94a3b8" }}
          />
          {item.name}
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
      key: "status",
      header: "Estado",
      cell: (item) =>
        item.isActive ? (
          <Badge variant="success">Activa</Badge>
        ) : (
          <Badge variant="destructive">Inactiva</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (item) => (
        <div className="flex justify-end gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            disabled={togglingId === item.id}
            onClick={() => void toggleActive(item)}
          >
            {item.isActive ? "Desactivar" : "Reactivar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleBasedRoute allowedRoles={["ADMIN", "PERSONAL_ADMINISTRATIVO"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" asChild className="w-fit -ml-2">
              <Link href="/expenses">
                <ArrowLeft className="size-4" />
                Volver a gastos
              </Link>
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">
              Categorías de gasto
            </h2>
            <p className="text-muted-foreground">
              Catálogo de categorías para clasificar los gastos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIncludeInactive((value) => !value)}
            >
              {includeInactive ? "Ocultar inactivas" : "Mostrar inactivas"}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nueva categoría
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          rowKey={(item) => item.id}
          loading={loading}
          error={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
          emptyMessage="No hay categorías registradas"
        />

        <CategoryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          category={editing}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </RoleBasedRoute>
  );
}
