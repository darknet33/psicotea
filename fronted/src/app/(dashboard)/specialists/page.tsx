"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { SpecialistForm } from "@/components/forms/specialist-form";
import {
  listSpecialists,
  updateSpecialist,
} from "@/lib/api/specialists";
import { getErrorMessage } from "@/lib/axios";
import { formatPrice } from "@/lib/format";
import type { Specialist } from "@/types/specialist";
import { SPECIALIST_SHIFT_LABELS } from "@/types/specialist";

function scheduleSummary(specialist: Specialist): string {
  if (!specialist.schedules || specialist.schedules.length === 0) {
    return "Sin horario";
  }
  const labels = new Set(
    specialist.schedules.map((day) =>
      day.shift ? SPECIALIST_SHIFT_LABELS[day.shift] : "Personalizado",
    ),
  );
  return Array.from(labels).join(" · ");
}

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Specialist | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchSpecialists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSpecialists(
        await listSpecialists({
          includeInactive,
          search: search.trim() || undefined,
        }),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [includeInactive, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchSpecialists();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchSpecialists]);

  async function toggleActive(specialist: Specialist) {
    try {
      setTogglingId(specialist.id);
      const updated = await updateSpecialist(specialist.id, {
        isActive: !specialist.isActive,
      });
      toast.success(updated.isActive ? "Especialista reactivado" : "Especialista desactivado");
      setSpecialists((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<Specialist>[] = [
    {
      key: "name",
      header: "Especialista",
      cell: (specialist) => (
        <Link
          href={`/specialists/${specialist.id}`}
          className="font-medium hover:underline"
        >
          {specialist.user.name} {specialist.user.lastName}
        </Link>
      ),
    },
    {
      key: "specialty",
      header: "Especialidad",
      cell: (specialist) => specialist.specialty,
    },
    {
      key: "professionalId",
      header: "Carnet profesional",
      cell: (specialist) => specialist.professionalId,
    },
    {
      key: "schedule",
      header: "Horario",
      cell: (specialist) => (
        <span className="text-sm text-muted-foreground">
          {scheduleSummary(specialist)}
        </span>
      ),
    },
    {
      key: "salary",
      header: "Sueldo",
      cell: (specialist) =>
        specialist.monthlySalary != null
          ? formatPrice(specialist.monthlySalary)
          : "—",
    },
    {
      key: "status",
      header: "Estado",
      cell: (specialist) =>
        specialist.isActive ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (specialist) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/specialists/${specialist.id}`}>Ver</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(specialist);
              setFormOpen(true);
            }}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={togglingId === specialist.id}
            onClick={() => void toggleActive(specialist)}
          >
            {specialist.isActive ? "Desactivar" : "Reactivar"}
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
            <h2 className="text-2xl font-bold tracking-tight">Especialistas</h2>
            <p className="text-muted-foreground">
              Perfiles profesionales, horarios y sueldos del equipo de especialistas.
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
              Nuevo especialista
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={specialists}
          rowKey={(specialist) => specialist.id}
          loading={loading}
          error={error}
          onRetry={() => void fetchSpecialists()}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nombre, carnet o especialidad..."
          emptyMessage="No hay especialistas registrados"
          emptyAction={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Nuevo especialista
            </Button>
          }
        />
      </div>

      <SpecialistForm
        open={formOpen}
        onOpenChange={setFormOpen}
        specialist={editing}
        onSaved={() => void fetchSpecialists()}
      />
    </RoleBasedRoute>
  );
}
