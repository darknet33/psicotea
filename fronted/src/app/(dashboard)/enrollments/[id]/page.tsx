"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEnrollment, updateEnrollment } from "@/lib/api/enrollments";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import {
  ENROLLMENT_STATUSES,
  SHIFT_LABELS,
  WEEKDAY_LABELS,
  type Enrollment,
  type EnrollmentStatus,
} from "@/types/enrollment";

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const variant = {
    ACTIVO: "success",
    INACTIVO: "secondary",
    RETIRADO: "warning",
  }[status] as "success" | "secondary" | "warning";

  return <Badge variant={variant}>{status}</Badge>;
}

export default function EnrollmentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getEnrollment(id);
        if (cancelled) return;
        setEnrollment(data);
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
  }, [id, refreshKey]);

  async function handleStatusChange(status: EnrollmentStatus) {
    if (!enrollment || status === enrollment.status) return;
    try {
      await updateEnrollment(enrollment.id, { status });
      toast.success("Estado actualizado");
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/enrollments">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col items-start gap-2 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !enrollment) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/enrollments">
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Inscripción #{enrollment.id}
              </h2>
              <StatusBadge status={enrollment.status} />
            </div>
            {enrollment.child && (
              <Link
                href={`/children/${enrollment.child.id}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                {enrollment.child.name} {enrollment.child.lastName}
              </Link>
            )}
          </div>
        </div>

        {canWrite && (
          <select
            aria-label="Cambiar estado"
            value={enrollment.status}
            onChange={(event) =>
              void handleStatusChange(event.target.value as EnrollmentStatus)
            }
            className="h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {ENROLLMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Facturado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(enrollment.facturado ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(enrollment.pagado ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                (enrollment.saldo ?? 0) > 0 ? "text-warning" : "text-success"
              }`}
            >
              {formatPrice(enrollment.saldo ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la inscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Inicio:</span>{" "}
              {formatDate(enrollment.startDate)}
            </p>
            <p>
              <span className="text-muted-foreground">Fin:</span>{" "}
              {enrollment.endDate ? formatDate(enrollment.endDate) : "Presente"}
            </p>
            <p>
              <span className="text-muted-foreground">Duración:</span>{" "}
              {enrollment.durationDays ? `${enrollment.durationDays} días` : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Matrícula mensual:</span>{" "}
              {formatPrice(enrollment.monthlyFee)}
            </p>
            {enrollment.notes && (
              <p>
                <span className="text-muted-foreground">Notas:</span> {enrollment.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agenda semanal</CardTitle>
            <CardDescription>Días y turnos en los que asiste el niño.</CardDescription>
          </CardHeader>
          <CardContent>
            {!enrollment.scheduleDays || enrollment.scheduleDays.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin agenda definida.</p>
            ) : (
              <div className="space-y-1 text-sm">
                {enrollment.scheduleDays.map((day) => (
                  <div
                    key={day.dayOfWeek}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span>{WEEKDAY_LABELS[day.dayOfWeek]}</span>
                    <Badge variant="secondary">{SHIFT_LABELS[day.shift]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Áreas de trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          {!enrollment.areas || enrollment.areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin áreas asignadas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {enrollment.areas.map((area) => (
                <Badge key={area.id} variant="outline">
                  {area.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos</CardTitle>
          <CardDescription>Pagos registrados para esta inscripción.</CardDescription>
        </CardHeader>
        <CardContent>
          {!enrollment.payments || enrollment.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-2 font-medium">Fecha</th>
                    <th className="p-2 font-medium">Monto</th>
                    <th className="p-2 font-medium">Método</th>
                    <th className="p-2 font-medium">Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollment.payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="p-2">{formatDate(payment.paymentDate)}</td>
                      <td className="p-2 font-medium">{formatPrice(payment.amount)}</td>
                      <td className="p-2">{payment.method}</td>
                      <td className="p-2 text-muted-foreground">
                        {payment.periodStart.slice(0, 7)} a {payment.periodEnd.slice(0, 7)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
