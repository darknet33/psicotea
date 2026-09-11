"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { listEnrollments, updateEnrollment } from "@/lib/api/enrollments";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { ENROLLMENT_STATUSES, type Enrollment, type EnrollmentStatus } from "@/types/enrollment";

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

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") ?? "",
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await listEnrollments({
          childId: childIdParam ? Number(childIdParam) : undefined,
          status: statusFilter === "" ? undefined : (statusFilter as EnrollmentStatus),
        });
        if (cancelled) return;
        setEnrollments(data);
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
  }, [childIdParam, statusFilter, refreshKey]);

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

  const columns: DataTableColumn<Enrollment>[] = [
    {
      key: "child",
      header: "Niño",
      cell: (enrollment) =>
        enrollment.child ? (
          <Link href={`/children/${enrollment.child.id}`} className="font-medium hover:underline">
            {enrollment.child.name} {enrollment.child.lastName}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "startDate",
      header: "Inicio",
      cell: (enrollment) => formatDate(enrollment.startDate),
    },
    {
      key: "endDate",
      header: "Fin",
      cell: (enrollment) =>
        enrollment.endDate ? formatDate(enrollment.endDate) : "Presente",
    },
    {
      key: "monthlyFee",
      header: "Matrícula",
      cell: (enrollment) => formatPrice(enrollment.monthlyFee),
    },
    {
      key: "status",
      header: "Estado",
      cell: (enrollment) => <StatusBadge status={enrollment.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (enrollment) =>
        canWrite ? (
          <select
            aria-label="Cambiar estado"
            value={enrollment.status}
            onChange={(event) =>
              void handleStatusChange(enrollment, event.target.value as EnrollmentStatus)
            }
            className="rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ENROLLMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Inscripciones</h2>
          <p className="text-muted-foreground">Seguimiento de las inscripciones de los niños.</p>
        </div>
        <div className="flex gap-2">
          {(["", ...ENROLLMENT_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className="rounded-full border px-3 py-1 text-sm"
              style={statusFilter === status ? { fontWeight: 600 } : undefined}
            >
              {status === "" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={enrollments}
        rowKey={(enrollment) => enrollment.id}
        loading={loading}
        error={error}
        onRetry={() => setRefreshKey((key) => key + 1)}
        emptyMessage={childIdParam ? "No hay inscripciones para este niño" : "No hay inscripciones registradas"}
      />
    </div>
  );
}