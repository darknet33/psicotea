"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentForm } from "@/components/forms/payment-form";
import { listPendingPayments } from "@/lib/api/payments";
import { formatDate, formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { EnrollmentDebtItem, PendingPayment } from "@/types/payment";
import { enrollmentTypeLabel } from "@/types/enrollment";

function DebtRow({ debt, label }: { debt: EnrollmentDebtItem; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div>
        <p>
          {label ? `${label}: ` : ""}
          {enrollmentTypeLabel(debt.type)} · {formatDate(debt.startDate)} a{" "}
          {debt.endDate ? formatDate(debt.endDate) : "presente"}
        </p>
        <p className="text-xs text-muted-foreground">
          Total: {formatPrice(debt.amount)} · Total pagado: {formatPrice(debt.pagado)}
        </p>
      </div>
      <span className="font-semibold text-warning">{formatPrice(debt.saldo)}</span>
    </div>
  );
}

export default function PendingPaymentsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [paymentChildId, setPaymentChildId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const data = await listPendingPayments();
        if (cancelled) return;
        setPending(data);
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
  }, [refreshKey]);

  function handleCreated() {
    toast.success("Pago registrado correctamente");
    setPaymentChildId(null);
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/payments">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Pagos pendientes</h2>
          <p className="text-muted-foreground">
            Deudas por niño, separando la inscripción activa de las deudas anteriores.
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
            Reintentar
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay deudas pendientes.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pending.map((item) => (
            <Card key={item.child.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <Link
                    href={`/children/${item.child.id}`}
                    className="font-medium hover:underline"
                  >
                    {item.child.name} {item.child.lastName}
                  </Link>
                  <span className="font-semibold">
                    Total: {formatPrice(item.totalDue)}
                  </span>
                </div>

                {item.active && (
                  <div className="rounded-md border p-2">
                    <Badge variant="success" className="mb-2">
                      Inscripción activa
                    </Badge>
                    <DebtRow debt={item.active} label="Saldo pendiente" />
                  </div>
                )}

                {item.previousDebts.length > 0 && (
                  <div className="rounded-md border p-2">
                    <Badge variant="warning" className="mb-2">
                      Deudas anteriores
                    </Badge>
                    <div className="space-y-2">
                      {item.previousDebts.map((debt) => (
                        <DebtRow key={debt.enrollmentId} debt={debt} />
                      ))}
                    </div>
                  </div>
                )}

                {canWrite && (
                  <Button size="sm" onClick={() => setPaymentChildId(item.child.id)}>
                    <Plus className="size-4" />
                    Registrar pago
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canWrite && (
        <PaymentForm
          open={paymentChildId !== null}
          onOpenChange={(open) => {
            if (!open) setPaymentChildId(null);
          }}
          defaultChildId={paymentChildId ?? undefined}
          child={
            paymentChildId !== null
              ? (() => {
                  const item = pending.find((p) => p.child.id === paymentChildId);
                  return item
                    ? { id: item.child.id, firstName: item.child.name, lastName: item.child.lastName }
                    : { id: paymentChildId, firstName: "", lastName: "" };
                })()
              : null
          }
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
