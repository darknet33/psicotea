"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { listChildren } from "@/lib/api/children";
import { formatAge } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { isLegacyCarnet } from "@/lib/carnet";
import { useAuthStore } from "@/stores/auth-store";
import type { Child } from "@/types/child";

export default function ChildrenPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listChildren({
        search: search.trim() || undefined,
        isActive: isActive === "" ? undefined : isActive === "true",
      });
      setChildren(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, isActive]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchChildren();
    }, 400);
    return () => clearTimeout(timeout);
  }, [fetchChildren]);

  const columns: DataTableColumn<Child>[] = [
    {
      key: "name",
      header: "Nombre",
      cell: (child) => (
        <div className="flex items-center gap-3">
          {child.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={child.photoUrl}
              alt=""
              className="size-9 shrink-0 rounded-full border object-cover"
            />
          )}
          <Link href={`/children/${child.id}`} className="font-medium hover:underline">
            {child.name} {child.lastName}
          </Link>
        </div>
      ),
    },
    {
      key: "carnet",
      header: "Carnet",
      cell: (child) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs">{child.carnet}</span>
          {isLegacyCarnet(child.carnet) && (
            <Badge variant="warning" className="text-[10px]">
              Provisional
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "birth",
      header: "Edad",
      cell: (child) => formatAge(child.dateOfBirth),
    },
    {
      key: "parent",
      header: "Tutor",
      cell: (child) => {
        const tutor =
          child.tutors.find((t) => t.isPrimary) ?? child.tutors[0];
        if (!tutor) return <span className="text-muted-foreground">—</span>;
        return (
          <div>
            <p>
              {tutor.name} {tutor.lastName}
              {tutor.isPrimary ? null : (
                <span className="text-xs text-muted-foreground"> · Princip.</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{tutor.phone}</p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      cell: (child) =>
        child.isActive ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (child) =>
        canWrite ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/children/${child.id}`}>Ver</Link>
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Niños</h2>
          <p className="text-muted-foreground">Gestión de los pacientes de PsicoTea.</p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href="/children/new">
              <Plus className="size-4" />
              Nuevo niño
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={children}
        rowKey={(child) => child.id}
        loading={loading}
        error={error}
        onRetry={() => void fetchChildren()}
        emptyMessage={role === "ESPECIALISTA" ? "No tenés niños asignados" : "No hay niños registrados"}
        searchValue={search}
        onSearchChange={(value) => setSearch(value)}
        searchPlaceholder="Buscar por nombre o apellido..."
      />

      <div className="flex gap-2">
        {(["", "true", "false"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setIsActive(value)}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-50"
            disabled={role === "ESPECIALISTA"}
            data-active={isActive === value}
            style={isActive === value ? { fontWeight: 600 } : undefined}
          >
            {value === "" ? "Todos" : value === "true" ? "Activos" : "Inactivos"}
          </button>
        ))}
      </div>
    </div>
  );
}