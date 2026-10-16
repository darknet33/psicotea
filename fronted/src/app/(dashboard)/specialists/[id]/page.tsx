"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { SpecialistForm } from "@/components/forms/specialist-form";
import { SpecialistScheduleForm } from "@/components/forms/specialist-schedule-form";
import { SpecialistPaymentForm } from "@/components/forms/specialist-payment-form";
import { listAreas } from "@/lib/api/areas";
import { listChildren } from "@/lib/api/children";
import {
  deleteSpecialistPayment,
  getSpecialist,
  getSpecialistPaymentPeriods,
  listSpecialistPayments,
  replaceSpecialistAreas,
  replaceSpecialistChildren,
} from "@/lib/api/specialists";
import { getErrorMessage } from "@/lib/axios";
import { formatDate, formatPrice } from "@/lib/format";
import type { Area } from "@/types/area";
import type { Child } from "@/types/child";
import type {
  Specialist,
  SpecialistPayment,
  SpecialistPaymentPeriod,
} from "@/types/specialist";
import { SPECIALIST_SHIFT_LABELS } from "@/types/specialist";

const paymentMethodLabel: Record<string, string> = {
  EFECTIVO: "Efectivo",
  QR: "QR",
  TRANSFERENCIA: "Transferencia",
};

export default function SpecialistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<SpecialistPayment[]>([]);
  const [periods, setPeriods] = useState<SpecialistPaymentPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<number[]>([]);
  const [savingAreas, setSavingAreas] = useState(false);
  const [savingChildren, setSavingChildren] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payingPeriod, setPayingPeriod] = useState<SpecialistPaymentPeriod | null>(null);

  const fetchAll = useCallback(async () => {
    if (!Number.isFinite(id)) return;
    try {
      setLoading(true);
      setError(null);
      const [detail, areaList, childList, paymentList, periodList] = await Promise.all([
        getSpecialist(id),
        listAreas(),
        listChildren(),
        listSpecialistPayments(id),
        getSpecialistPaymentPeriods(id),
      ]);
      setSpecialist(detail);
      setAreas(areaList);
      setChildren(childList);
      setPayments(paymentList);
      setPeriods(periodList);
      setSelectedAreas(detail.areas.map((link) => link.areaId));
      setSelectedChildren((detail.children ?? []).map((child) => child.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchAll();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchAll]);

  function toggleArea(areaId: number) {
    setSelectedAreas((current) =>
      current.includes(areaId)
        ? current.filter((item) => item !== areaId)
        : [...current, areaId],
    );
  }

  function toggleChild(childId: number) {
    setSelectedChildren((current) =>
      current.includes(childId)
        ? current.filter((item) => item !== childId)
        : [...current, childId],
    );
  }

  async function saveAreas() {
    try {
      setSavingAreas(true);
      const updated = await replaceSpecialistAreas(id, selectedAreas);
      setSpecialist(updated);
      setSelectedAreas(updated.areas.map((link) => link.areaId));
      toast.success("Áreas actualizadas");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingAreas(false);
    }
  }

  async function saveChildren() {
    try {
      setSavingChildren(true);
      const updated = await replaceSpecialistChildren(id, selectedChildren);
      setSpecialist(updated);
      setSelectedChildren((updated.children ?? []).map((child) => child.id));
      toast.success("Niños asignados actualizados");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingChildren(false);
    }
  }

  async function removePayment(payment: SpecialistPayment) {
    try {
      await deleteSpecialistPayment(id, payment.id);
      toast.success("Pago eliminado");
      void fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const paymentColumns: DataTableColumn<SpecialistPayment>[] = [
    {
      key: "period",
      header: "Período",
      cell: (payment) =>
        `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`,
    },
    {
      key: "amount",
      header: "Monto",
      cell: (payment) => formatPrice(payment.amount),
    },
    {
      key: "paymentDate",
      header: "Fecha de pago",
      cell: (payment) => formatDate(payment.paymentDate),
    },
    {
      key: "method",
      header: "Método",
      cell: (payment) => paymentMethodLabel[payment.method] ?? payment.method,
    },
    {
      key: "notes",
      header: "Nota",
      cell: (payment) =>
        payment.notes ? payment.notes : <span className="text-muted-foreground">—</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (payment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void removePayment(payment)}
          aria-label="Eliminar pago"
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <RoleBasedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/specialists">
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error || !specialist ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {error ?? "Especialista no encontrado"}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {specialist.user.name} {specialist.user.lastName}
                  </h2>
                  {specialist.isActive ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{specialist.specialty}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="size-4" />
                Editar perfil
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Datos profesionales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Carnet profesional</p>
                  <p className="font-medium">{specialist.professionalId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matrícula</p>
                  <p className="font-medium">{specialist.licenseNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{specialist.user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{specialist.phone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dirección</p>
                  <p className="font-medium">{specialist.address ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de ingreso</p>
                  <p className="font-medium">{formatDate(specialist.entryDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sueldo mensual</p>
                  <p className="font-medium">
                    {specialist.monthlySalary != null
                      ? formatPrice(specialist.monthlySalary)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horario</p>
                  <p className="font-medium">
                    {specialist.schedules.length === 0
                      ? "Sin horario definido"
                      : Array.from(
                          new Set(
                            specialist.schedules.map((day) =>
                              day.shift
                                ? SPECIALIST_SHIFT_LABELS[day.shift]
                                : "Personalizado",
                            ),
                          ),
                        ).join(" · ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <SpecialistScheduleForm specialistId={id} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Áreas</CardTitle>
                  <CardDescription>
                    Modalidades que puede atender este especialista.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {areas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay áreas en el catálogo.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {areas.map((area) => (
                        <label key={area.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={selectedAreas.includes(area.id)}
                            onChange={() => toggleArea(area.id)}
                          />
                          {area.name}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={saveAreas} disabled={savingAreas}>
                      {savingAreas ? "Guardando..." : "Guardar áreas"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Niños asignados</CardTitle>
                  <CardDescription>
                    Los niños marcados quedan bajo el cuidado de este especialista.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay niños registrados.
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                      {children.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4"
                            checked={selectedChildren.includes(child.id)}
                            onChange={() => toggleChild(child.id)}
                          />
                          {child.name} {child.lastName}
                          {child.specialistId && child.specialistId !== id && (
                            <span className="text-xs text-muted-foreground">
                              (otro especialista)
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={saveChildren} disabled={savingChildren}>
                      {savingChildren ? "Guardando..." : "Guardar niños"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <CardTitle>Sueldos y honorarios</CardTitle>
                  <CardDescription>
                    Períodos mensuales desde la fecha de ingreso y pagos registrados.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setPayingPeriod(null);
                    setPaymentOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Registrar pago
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {periods.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {periods.map((period) => (
                      <div
                        key={period.periodStart}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">{period.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {period.isPaid
                              ? `Pagado: ${formatPrice(period.totalPaid)}`
                              : "Pendiente"}
                          </p>
                        </div>
                        {period.isPaid ? (
                          <Badge variant="success">Pagado</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPayingPeriod(period);
                              setPaymentOpen(true);
                            }}
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <DataTable
                  columns={paymentColumns}
                  data={payments}
                  rowKey={(payment) => payment.id}
                  emptyMessage="No hay pagos registrados"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {specialist && (
        <>
          <SpecialistForm
            open={formOpen}
            onOpenChange={setFormOpen}
            specialist={specialist}
            onSaved={() => void fetchAll()}
          />
          <SpecialistPaymentForm
            specialistId={id}
            monthlySalary={specialist.monthlySalary}
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            period={payingPeriod}
            onSaved={() => void fetchAll()}
          />
        </>
      )}
    </RoleBasedRoute>
  );
}
