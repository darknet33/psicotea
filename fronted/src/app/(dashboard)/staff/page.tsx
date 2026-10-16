"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { StaffForm } from "@/components/forms/staff-form";
import { listStaff, updateStaff } from "@/lib/api/staff";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import type { Staff } from "@/types/staff";

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await listStaff(includeInactive, search || undefined);
        if (cancelled) return;
        setStaff(data);
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
  }, [includeInactive, search, refreshKey]);

  async function toggleActive(item: Staff) {
    try {
      setTogglingId(item.id);
      const updated = await updateStaff(item.id, { isActive: !item.isActive });
      toast.success(updated.isActive ? "Personal reactivado" : "Personal desactivado");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<Staff>[] = [
    {
      key: "name",
      header: "Nombre",
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {item.user.name} {item.user.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{item.user.email}</span>
        </div>
      ),
    },
    {
      key: "employeeId",
      header: "Código",
      cell: (item) => <span className="text-muted-foreground">{item.employeeId}</span>,
    },
    {
      key: "position",
      header: "Cargo",
      cell: (item) => (
        <div className="flex flex-col">
          <span>{item.position}</span>
          {item.department && (
            <span className="text-xs text-muted-foreground">{item.department}</span>
          )}
        </div>
      ),
    },
    {
      key: "hireDate",
      header: "Ingreso",
      cell: (item) => formatDate(item.hireDate),
    },
    {
      key: "salary",
      header: "Salario",
      cell: (item) =>
        item.salary != null ? (
          formatPrice(item.salary)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (item) =>
        item.isActive ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
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
    <RoleBasedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Personal</h2>
            <p className="text-muted-foreground">
              Personal administrativo del centro, cargos y datos laborales.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIncludeInactive((value) => !value)}
            >
              {includeInactive ? "Ocultar inactivos" : "Mostrar inactivos"}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nuevo personal
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={staff}
          rowKey={(item) => item.id}
          loading={loading}
          error={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre, cargo o código..."
          emptyMessage="No hay personal registrado"
        />

        <StaffForm
          open={formOpen}
          onOpenChange={setFormOpen}
          staff={editing}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </RoleBasedRoute>
  );
}
