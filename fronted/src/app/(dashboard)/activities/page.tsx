"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { ChildSelect } from "@/components/forms/child-select";
import { ActivityForm } from "@/components/forms/activity-form";
import { deleteActivity, listActivities } from "@/lib/api/activities";
import { formatDate } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import type { Activity } from "@/types/activity";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childId, setChildId] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await listActivities({
          childId: childId || undefined,
          from: from || undefined,
          to: to || undefined,
          search: search || undefined,
        });
        if (cancelled) return;
        setActivities(data);
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
  }, [childId, from, to, search, refreshKey]);

  async function handleDelete(activity: Activity) {
    if (
      !window.confirm(
        `¿Eliminar la actividad "${activity.title}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      await deleteActivity(activity.id);
      toast.success("Actividad eliminada");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns: DataTableColumn<Activity>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (item) => formatDate(item.date),
    },
    {
      key: "child",
      header: "Niño",
      cell: (item) => (
        <span className="font-medium">
          {item.child.name} {item.child.lastName}
        </span>
      ),
    },
    {
      key: "title",
      header: "Actividad",
      cell: (item) => (
        <div className="flex flex-col">
          <span>{item.title}</span>
          {item.description && (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {item.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "specialist",
      header: "Responsable",
      cell: (item) => (
        <span className="text-muted-foreground">
          {item.specialist.name} {item.specialist.lastName}
        </span>
      ),
    },
    {
      key: "duration",
      header: "Duración",
      cell: (item) =>
        item.duration != null ? (
          `${item.duration} min`
        ) : (
          <span className="text-muted-foreground">—</span>
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
            className="text-destructive"
            onClick={() => void handleDelete(item)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleBasedRoute
      allowedRoles={["ADMIN", "ESPECIALISTA", "PERSONAL_ADMINISTRATIVO"]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Actividades</h2>
            <p className="text-muted-foreground">
              Actividades diarias por niño, responsable y fecha.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nueva actividad
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <ChildSelect value={childId} onChange={setChildId} allowEmpty />
          <div className="space-y-1">
            <label htmlFor="activity-filter-from" className="text-sm font-medium">
              Desde
            </label>
            <input
              id="activity-filter-from"
              type="date"
              className={inputClass}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="activity-filter-to" className="text-sm font-medium">
              Hasta
            </label>
            <input
              id="activity-filter-to"
              type="date"
              className={inputClass}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={activities}
          rowKey={(item) => item.id}
          loading={loading}
          error={error}
          onRetry={() => setRefreshKey((key) => key + 1)}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por actividad..."
          emptyMessage="No hay actividades para el filtro seleccionado"
        />

        <ActivityForm
          open={formOpen}
          onOpenChange={setFormOpen}
          activity={editing}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      </div>
    </RoleBasedRoute>
  );
}
