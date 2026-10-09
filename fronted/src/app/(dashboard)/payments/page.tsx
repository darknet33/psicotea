"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { PaymentForm } from "@/components/forms/payment-form";
import { listPayments } from "@/lib/api/payments";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { Payment } from "@/types/payment";
import { enrollmentTypeLabel } from "@/types/enrollment";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const childIdParam = searchParams.get("childId");

  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [period, setPeriod] = useState<string>(searchParams.get("period") ?? "");
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await listPayments({
          childId: childIdParam ? Number(childIdParam) : undefined,
          ...(period ? { periodStart: `${period}-01`, periodEnd: `${period}-31` } : {}),
        });
        if (cancelled) return;
        setPayments(data);
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
  }, [childIdParam, period, refreshKey]);

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "child",
      header: "Niño",
      cell: (payment) =>
        payment.child ? (
          <Link href={`/children/${payment.child.id}`} className="font-medium hover:underline">
            {payment.child.name} {payment.child.lastName}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "paymentDate",
      header: "Fecha de pago",
      cell: (payment) => formatDate(payment.paymentDate),
    },
    {
      key: "amount",
      header: "Monto",
      cell: (payment) => <span className="font-medium">{formatPrice(payment.amount)}</span>,
    },
    {
      key: "method",
      header: "Método",
      cell: (payment) => payment.method,
    },
    {
      key: "period",
      header: "Período cubierto",
      cell: (payment) => (
        <span className="text-muted-foreground">
          {payment.periodStart.slice(0, 7)} a {payment.periodEnd.slice(0, 7)}
        </span>
      ),
    },
    {
      key: "enrollment",
      header: "Inscripción asociada",
      cell: (payment) => {
        const allocation =
          payment.allocations?.find(
            (item) => item.enrollmentId === payment.enrollmentId,
          ) ?? payment.allocations?.[0];
        const enrollment = allocation?.enrollment;
        if (!enrollment) {
          return <span className="text-muted-foreground">Sin inscripción</span>;
        }
        return (
          <span className="text-muted-foreground">
            {enrollmentTypeLabel(enrollment.type)} · {formatDate(enrollment.startDate)}
            {enrollment.endDate ? ` a ${formatDate(enrollment.endDate)}` : " a presente"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      cell: (payment) => {
        const isLate = new Date(payment.paymentDate) > new Date(payment.periodEnd);
        const isDistributed = (payment.allocations?.length ?? 0) > 1;
        if (!isLate && !isDistributed) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {isLate && <Badge variant="warning">Atrasado</Badge>}
            {isDistributed && <Badge variant="secondary">Distribuido</Badge>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Pagos</h2>
          <p className="text-muted-foreground">Historial de cobros registrados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/payments/pending">
              <TriangleAlert className="size-4" />
              Pagos pendientes
            </Link>
          </Button>
          {canWrite && (
            <Button size="sm" onClick={() => setPaymentOpen(true)}>
              <Plus className="size-4" />
              Registrar pago
            </Button>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="period-filter" className="mb-2 block text-sm font-medium">
          Periodo
        </label>
        <input
          id="period-filter"
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <DataTable
        columns={columns}
        data={payments}
        rowKey={(payment) => payment.id}
        loading={loading}
        error={error}
        onRetry={() => setRefreshKey((key) => key + 1)}
        emptyMessage={childIdParam ? "No hay pagos para este niño" : "No hay pagos registrados"}
      />

      {canWrite && (
        <PaymentForm
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          defaultChildId={childIdParam ? Number(childIdParam) : undefined}
          onCreated={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </div>
  );
}