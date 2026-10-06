"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listEnrollments, updateEnrollment } from "@/lib/api/enrollments";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage, resolveMediaUrl } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import {
  ENROLLMENT_STATUSES,
  SHIFT_LABELS,
  WEEKDAY_LABELS,
  type Enrollment,
  type EnrollmentStatus,
  type ListEnrollmentsResponse,
} from "@/types/enrollment";

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const variant = {
    ACTIVO: "success",
    INACTIVO: "secondary",
    RETIRADO: "warning",
  }[status] as "success" | "secondary" | "warning";

  return <Badge variant={variant}>{status}</Badge>;
}

export default function EnrollmentsPage() {
  const searchParams = useSearchParams();
  const childIdParam = searchParams.get("childId");

  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [data, setData] = useState<ListEnrollmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") ?? "",
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const result = await listEnrollments({
          childId: childIdParam ? Number(childIdParam) : undefined,
          status: statusFilter === "" ? undefined : (statusFilter as EnrollmentStatus),
          search: search.trim() || undefined,
          page,
          limit: 20,
        });
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [childIdParam, statusFilter, search, page, refreshKey]);

  async function handleStatusChange(enrollment: Enrollment, status: EnrollmentStatus) {
    if (status === enrollment.status) return;
    const childName = enrollment.child
      ? `${enrollment.child.name} ${enrollment.child.lastName}`
      : "este niño";
    if (!window.confirm(`¿Cambiar la inscripción de ${childName} a estado "${status}"?`)) {
      return;
    }
    try {
      await updateEnrollment(enrollment.id, { status });
      toast.success("Estado actualizado");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const groups = data?.groups ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Inscripciones</h2>
        <p className="text-muted-foreground">
          Seguimiento por niño con el saldo de cada inscripción.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o apellido"
            className="pl-8"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", ...ENROLLMENT_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className="rounded-full border px-3 py-1 text-sm"
              style={statusFilter === status ? { fontWeight: 600 } : undefined}
            >
              {status === "" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
            Reintentar
          </Button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : groups.length === 0 ? (
        <p className="rounded-lg border p-6 text-sm text-muted-foreground">
          {childIdParam
            ? "Este niño no tiene inscripciones"
            : "No hay inscripciones registradas"}
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.child.id}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/children/${group.child.id}`}
                  className="flex items-center gap-2 text-base font-semibold hover:underline"
                >
                  {group.child.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(group.child.photoUrl)}
                      alt={`Foto de ${group.child.name} ${group.child.lastName}`}
                      className="size-8 rounded-full border object-cover"
                    />
                  )}
                  {group.child.name} {group.child.lastName}
                </Link>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    Facturado: {formatPrice(group.totals.facturado)}
                  </Badge>
                  <Badge variant="secondary">
                    Pagado: {formatPrice(group.totals.pagado)}
                  </Badge>
                  <Badge variant={group.totals.saldo > 0 ? "warning" : "success"}>
                    Saldo: {formatPrice(group.totals.saldo)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-lg border">
                  {group.enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="space-y-2 p-3 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p>
                            {formatDate(enrollment.startDate)}
                            {enrollment.endDate
                              ? ` → ${formatDate(enrollment.endDate)}`
                              : " → presente"}
                            {enrollment.durationDays
                              ? ` · ${enrollment.durationDays} días`
                              : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Matrícula: {formatPrice(enrollment.monthlyFee)} · Saldo:{" "}
                            {formatPrice(enrollment.saldo ?? 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={enrollment.status} />
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/enrollments/${enrollment.id}`}>
                              Ver detalle
                            </Link>
                          </Button>
                          {canWrite && (
                            <select
                              aria-label="Cambiar estado"
                              value={enrollment.status}
                              onChange={(event) =>
                                void handleStatusChange(
                                  enrollment,
                                  event.target.value as EnrollmentStatus,
                                )
                              }
                              className="rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              {ENROLLMENT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {enrollment.scheduleDays && enrollment.scheduleDays.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {enrollment.scheduleDays.map((day) => (
                            <Badge key={day.dayOfWeek} variant="secondary">
                              {WEEKDAY_LABELS[day.dayOfWeek]}: {SHIFT_LABELS[day.shift]}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {enrollment.areas && enrollment.areas.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {enrollment.areas.map((area) => (
                            <Badge key={area.id} variant="outline">
                              {area.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {data.meta.page} de {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
