"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { AreaForm } from "@/components/forms/area-form";
import { listAreas, updateArea } from "@/lib/api/areas";
import { getErrorMessage } from "@/lib/axios";
import type { Area } from "@/types/area";

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setAreas(await listAreas(includeInactive));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchAreas();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchAreas]);

  function handleSaved() {
    void fetchAreas();
  }

  async function toggleActive(area: Area) {
    try {
      setTogglingId(area.id);
      const updated = await updateArea(area.id, { isActive: !area.isActive });
      toast.success(updated.isActive ? "Área reactivada" : "Área desactivada");
      setAreas((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  const columns: DataTableColumn<Area>[] = [
    {
      key: "name",
      header: "Nombre",
      cell: (area) => <span className="font-medium">{area.name}</span>,
    },
    {
      key: "description",
      header: "Descripción",
      cell: (area) =>
        area.description ? (
          area.description
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (area) =>
        area.isActive ? (
          <Badge variant="success">Activa</Badge>
        ) : (
          <Badge variant="destructive">Inactiva</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (area) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(area);
              setFormOpen(true);
            }}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={togglingId === area.id}
            onClick={() => void toggleActive(area)}
          >
            {area.isActive ? "Desactivar" : "Reactivar"}
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
            <h2 className="text-2xl font-bold tracking-tight">Áreas</h2>
            <p className="text-muted-foreground">
              Modalidades de trabajo que se asignan a las inscripciones.
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
              Nueva área
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={areas}
          rowKey={(area) => area.id}
          loading={loading}
          error={error}
          onRetry={() => void fetchAreas()}
          emptyMessage="No hay áreas en el catálogo"
        />
      </div>

      <AreaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        area={editing}
        onSaved={handleSaved}
      />
    </RoleBasedRoute>
  );
}
