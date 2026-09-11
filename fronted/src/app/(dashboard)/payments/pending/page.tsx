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
import { formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { PendingPaymentPeriod } from "@/types/payment";

export default function PendingPaymentsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const canWrite = role === "ADMIN" || role === "PERSONAL_ADMINISTRATIVO";

  const [pending, setPending] = useState<PendingPaymentPeriod[]>([]);
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
            Niños con mensualidades sin cobrar. Se muestran los meses adeudados por cada uno.
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
        <p className="text-sm text-muted-foreground">
          No hay deudas pendientes. Todos los cobros están al día.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pending.map((item) => (
            <Card key={item.child.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/children/${item.child.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.child.name} {item.child.lastName}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.periods.map((period) => (
                        <Badge key={period} variant="warning">
                          {period.slice(0, 7)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className="font-semibold">{formatPrice(item.amountDue)}</span>
                </div>
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
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}