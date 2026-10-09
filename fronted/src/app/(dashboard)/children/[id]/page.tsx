"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, IdCard, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentForm } from "@/components/forms/enrollment-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { formatAge, formatDate, formatPrice } from "@/lib/format";
import { getChild, removeChild, type ChildDetail } from "@/lib/api/children";
import { getEnrollmentSummary } from "@/lib/api/enrollments";
import { listPaymentsByChild } from "@/lib/api/payments";
import { getErrorMessage, resolveMediaUrl } from "@/lib/axios";
import { isLegacyCarnet } from "@/lib/carnet";
import { useAuthStore } from "@/stores/auth-store";
import {
  SHIFT_LABELS,
  WEEKDAY_LABELS,
  enrollmentTypeLabel,
  type Enrollment,
  type EnrollmentStatus,
  type EnrollmentSummary,
} from "@/types/enrollment";
import type { Payment } from "@/types/payment";

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const variant = {
    ACTIVO: "success",
    INACTIVO: "secondary",
    RETIRADO: "warning",
  }[status] as "success" | "secondary" | "warning";

  return <Badge variant={variant}>{status}</Badge>;
}

interface ObligationRowProps {
  enrollment: Enrollment;
  label?: string;
}

function ObligationRow({ enrollment, label }: ObligationRowProps) {
  return (
    <div className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">
          {label ? `${label} · ` : ""}
          {enrollmentTypeLabel(enrollment.type)} · {formatDate(enrollment.startDate)} a{" "}
          {enrollment.endDate ? formatDate(enrollment.endDate) : "presente"}
        </p>
        <p className="text-xs text-muted-foreground">
          Monto: {formatPrice(enrollment.total)} · Total pagado:{" "}
          {formatPrice(enrollment.pagado)} · Saldo pendiente:{" "}
          {formatPrice(enrollment.saldo)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={enrollment.status} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/enrollments/${enrollment.id}`}>Ver detalle</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const childId = Number(params.id);

  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [summary, setSummary] = useState<EnrollmentSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [data, enrollmentSummary, paymentList] = await Promise.all([
          getChild(childId),
          getEnrollmentSummary(childId),
          listPaymentsByChild(childId),
        ]);
        if (cancelled) return;
        setChild(data);
        setSummary(enrollmentSummary);
        setPayments(paymentList);
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
  }, [childId, refreshKey]);

  const enrollmentById = useMemo(() => {
    const map = new Map<number, Enrollment>();
    for (const enrollment of summary?.enrollments ?? []) {
      map.set(enrollment.id, enrollment);
    }
    return map;
  }, [summary]);

  const paymentsByEnrollment = useMemo(() => {
    const map = new Map<number | null, Payment[]>();
    for (const payment of payments) {
      const key = payment.enrollmentId ?? null;
      const list = map.get(key) ?? [];
      list.push(payment);
      map.set(key, list);
    }
    return map;
  }, [payments]);

  function handleCreatedEnrollment() {
    setRefreshKey((key) => key + 1);
  }

  function handleCreatedPayment() {
    setRefreshKey((key) => key + 1);
  }

  async function handleRemove() {
    if (!window.confirm("¿Eliminar este niño? Esta acción no se puede deshacer.")) return;
    try {
      await removeChild(childId);
      toast.success("Niño eliminado");
      router.push("/children");
      router.refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/children">
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

  if (loading || !child || !summary) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const specialistName = child.specialist
    ? `${child.specialist.user.name} ${child.specialist.user.lastName}`
    : null;

  const legacyCarnet = isLegacyCarnet(child.carnet);
  const hasPreviousEnrollments = summary.enrollments.length > 0;
  const active = summary.active;
  const previousDebts = summary.previousDebts;
  const history = [...summary.enrollments].reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/children">
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {child.name} {child.lastName}
              </h2>
              {child.isActive ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">Expediente del paciente.</p>
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/children/${child.id}/credencial`}>
                <IdCard className="size-4" />
                Credencial
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/children/${child.id}/edit`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => void handleRemove()}>
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del niño</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            {child.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(child.photoUrl)}
                alt={`Foto de ${child.name} ${child.lastName}`}
                className="size-32 shrink-0 rounded-lg border object-cover"
              />
            )}
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">Nombre:</span> {child.name} {child.lastName}</p>
              <p>
                <span className="text-muted-foreground">Carnet:</span>{" "}
                <span className="font-mono">{child.carnet}</span>{" "}
                {legacyCarnet && (
                  <Badge variant="warning" className="ml-1">
                    Provisional
                  </Badge>
                )}
              </p>
              <p><span className="text-muted-foreground">Fecha de nacimiento:</span> {formatDate(child.dateOfBirth)}</p>
              <p><span className="text-muted-foreground">Edad:</span> {formatAge(child.dateOfBirth)}</p>
              <p><span className="text-muted-foreground">Sexo:</span> {child.sex}</p>
              <p><span className="text-muted-foreground">Diagnóstico:</span> {child.diagnostico}</p>
              <p><span className="text-muted-foreground">Especialista:</span> {specialistName ?? "Sin asignar"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tutores / responsables</CardTitle>
            <CardDescription>Adultos responsables del niño.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {child.tutors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin tutores registrados.</p>
            ) : (
              child.tutors.map((tutor) => (
                <div key={tutor.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">
                      {tutor.name} {tutor.lastName}
                    </p>
                    {tutor.isPrimary && <Badge variant="success">Principal</Badge>}
                  </div>
                  <div className="mt-1 space-y-0.5 text-sm">
                    <p>
                      <span className="text-muted-foreground">Parentesco:</span> {tutor.relationship}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Celular/WhatsApp:</span> {tutor.phone}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {tutor.email ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Dirección:</span> {tutor.address ?? "—"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Carnet:</span> {tutor.carnet}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Inscripción activa</CardTitle>
            <CardDescription>
              Inscripción vigente del niño (estado activo dentro de sus fechas).
            </CardDescription>
          </div>
          {canWrite &&
            (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (active && active.endDate && new Date(active.endDate) >= today) {
                return null;
              }
              const label = hasPreviousEnrollments || active ? "Reinscribir" : "Nueva inscripción";
              return (
                <Button size="sm" onClick={() => setEnrollmentOpen(true)}>
                  <Plus className="size-4" />
                  {label}
                </Button>
              );
            })()}
        </CardHeader>
        <CardContent>
          {active ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo de inscripción</p>
                <p className="font-medium">{enrollmentTypeLabel(active.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="font-medium">
                  {formatDate(active.startDate)} a{" "}
                  {active.endDate ? formatDate(active.endDate) : "presente"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Monto de la inscripción</p>
                <p className="font-medium">{formatPrice(active.total)}</p>
                <p className="text-xs text-muted-foreground">
                  Total pagado: {formatPrice(active.pagado)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                <p className={`font-medium ${active.saldo > 0 ? "text-warning" : "text-success"}`}>
                  {formatPrice(active.saldo)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">
                El niño no tiene una inscripción vigente.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {previousDebts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deudas anteriores</CardTitle>
            <CardDescription>
              Saldos pendientes de inscripciones anteriores, independientes de la vigente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-lg border">
              {previousDebts.map((enrollment) => (
                <ObligationRow key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Inscripciones</CardTitle>
            <CardDescription>Historial de inscripciones del niño.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {summary.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin inscripciones registradas.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {history.map((enrollment) => (
                <div key={enrollment.id} className="flex flex-col gap-2 p-3 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {enrollmentTypeLabel(enrollment.type)} ·{" "}
                        {formatDate(enrollment.startDate)}
                        {enrollment.endDate
                          ? ` → ${formatDate(enrollment.endDate)}`
                          : " → presente"}
                        {enrollment.durationDays
                          ? ` · ${enrollment.durationDays} días`
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Monto: {formatPrice(enrollment.total)} · Total pagado:{" "}
                        {formatPrice(enrollment.pagado)} · Saldo pendiente:{" "}
                        {formatPrice(enrollment.saldo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {enrollment.vigente && <Badge variant="success">Vigente</Badge>}
                      <StatusBadge status={enrollment.status} />
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/enrollments/${enrollment.id}`}>Ver detalle</Link>
                      </Button>
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Historial de pagos</CardTitle>
            <CardDescription>
              Pagos agrupados por inscripción y período.
            </CardDescription>
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              <Plus className="size-4" />
              Registrar pago
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-4">
              {[...paymentsByEnrollment.entries()].map(([enrollmentId, groupPayments]) => {
                const enrollment = enrollmentId
                  ? enrollmentById.get(enrollmentId)
                  : undefined;
                return (
                  <div key={enrollmentId ?? "sin-inscripcion"} className="rounded-lg border">
                    <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                      {enrollment
                        ? `${enrollmentTypeLabel(enrollment.type)} · ${formatDate(enrollment.startDate)} a ${
                            enrollment.endDate ? formatDate(enrollment.endDate) : "presente"
                          }`
                        : "Sin inscripción asociada"}
                    </div>
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-left text-muted-foreground">
                          <th className="p-2 font-medium">Fecha de pago</th>
                          <th className="p-2 font-medium">Período</th>
                          <th className="p-2 font-medium">Monto</th>
                          <th className="p-2 font-medium">Método</th>
                          <th className="p-2 font-medium">Referencia / descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupPayments.map((payment) => {
                          const isLate =
                            new Date(payment.paymentDate) > new Date(payment.periodEnd);
                          const isDistributed =
                            (payment.allocations?.length ?? 0) > 1;
                          return (
                            <tr key={payment.id} className="border-b last:border-0">
                              <td className="p-2">{formatDate(payment.paymentDate)}</td>
                              <td className="p-2 text-muted-foreground">
                                {payment.periodStart.slice(0, 7)} a{" "}
                                {payment.periodEnd.slice(0, 7)}
                              </td>
                              <td className="p-2 font-medium">
                                {formatPrice(payment.amount)}
                              </td>
                              <td className="p-2">{payment.method}</td>
                              <td className="p-2">
                                <div className="flex flex-col gap-1">
                                  <span className="text-muted-foreground">
                                    {payment.reference || payment.description || "—"}
                                  </span>
                                  {(isLate || isDistributed) && (
                                    <div className="flex flex-wrap gap-1">
                                      {isLate && <Badge variant="warning">Atrasado</Badge>}
                                      {isDistributed && (
                                        <Badge variant="secondary">Distribuido</Badge>
                                      )}
                                    </div>
                                  )}
                                  {isDistributed && (
                                    <span className="text-xs text-muted-foreground">
                                      {payment.allocations
                                        ?.map((allocation) => {
                                          const target = enrollmentById.get(
                                            allocation.enrollmentId,
                                          );
                                          return `${allocation.enrollment?.type ?? target?.type ?? "—"}: ${formatPrice(
                                            allocation.amount,
                                          )}`;
                                        })
                                        .join(" · ")}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {canWrite && (
        <>
          <EnrollmentForm
            open={enrollmentOpen}
            onOpenChange={setEnrollmentOpen}
            childId={child.id}
            childName={`${child.name} ${child.lastName}`}
            warning={
              active
                ? "El niño ya tiene una inscripción vigente. La nueva inscripción no puede solaparse con las fechas existentes."
                : undefined
            }
            onCreated={handleCreatedEnrollment}
          />
          <PaymentForm
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            defaultChildId={child.id}
            child={{ id: child.id, firstName: child.name, lastName: child.lastName }}
            onCreated={handleCreatedPayment}
          />
        </>
      )}
    </div>
  );
}
