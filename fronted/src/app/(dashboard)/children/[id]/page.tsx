"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentForm } from "@/components/forms/enrollment-form";
import { PaymentForm } from "@/components/forms/payment-form";
import { formatAge, formatDate, formatPrice } from "@/lib/format";
import { getChild, removeChild, type ChildDetail } from "@/lib/api/children";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { Enrollment, EnrollmentStatus } from "@/types/enrollment";
import type { Payment } from "@/types/payment";

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const variant = {
    ACTIVO: "success",
    INACTIVO: "secondary",
    RETIRADO: "warning",
  }[status] as "success" | "secondary" | "warning";

  return <Badge variant={variant}>{status}</Badge>;
}

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const childId = Number(params.id);

  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await getChild(childId);
        if (cancelled) return;
        setChild(data);
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

  function handleCreatedEnrollment(enrollment: Enrollment) {
    setChild((prev) =>
      prev ? { ...prev, enrollments: [enrollment, ...prev.enrollments] } : prev,
    );
  }

  function handleCreatedPayment(payment: Payment) {
    setChild((prev) => (prev ? { ...prev, payments: [payment, ...prev.payments] } : prev));
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

  if (loading || !child) {
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
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Nombre:</span> {child.name} {child.lastName}</p>
            <p><span className="text-muted-foreground">Fecha de nacimiento:</span> {formatDate(child.dateOfBirth)}</p>
            <p><span className="text-muted-foreground">Edad:</span> {formatAge(child.dateOfBirth)}</p>
            <p><span className="text-muted-foreground">Sexo:</span> {child.sex}</p>
            <p><span className="text-muted-foreground">Inscripción:</span> {formatDate(child.enrollmentDate)}</p>
            <p><span className="text-muted-foreground">Especialista:</span> {specialistName ?? "Sin asignar"}</p>
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
            <CardTitle className="text-base">Inscripciones</CardTitle>
            <CardDescription>Historial de inscripciones del niño.</CardDescription>
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setEnrollmentOpen(true)}>
              <Plus className="size-4" />
              Nueva inscripción
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {child.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin inscripciones registradas.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {child.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p>
                      {formatDate(enrollment.startDate)}
                      {enrollment.endDate ? ` → ${formatDate(enrollment.endDate)}` : " → presente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Matrícula mensual: {formatPrice(enrollment.monthlyFee)}
                      {enrollment.notes ? ` · ${enrollment.notes}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={enrollment.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Pagos</CardTitle>
            <CardDescription>Historial de pagos del niño.</CardDescription>
          </div>
          {canWrite && (
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              <Plus className="size-4" />
              Registrar pago
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {child.payments.length === 0 ? (
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
                  {child.payments.map((payment) => (
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

      {canWrite && (
        <>
          <EnrollmentForm
            open={enrollmentOpen}
            onOpenChange={setEnrollmentOpen}
            defaultChildId={child.id}
            onCreated={handleCreatedEnrollment}
          />
          <PaymentForm
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            defaultChildId={child.id}
            onCreated={handleCreatedPayment}
          />
        </>
      )}
    </div>
  );
}