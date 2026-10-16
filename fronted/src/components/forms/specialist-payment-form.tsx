"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createSpecialistPayment } from "@/lib/api/specialists";
import { getErrorMessage } from "@/lib/axios";
import { todayInputValue } from "@/lib/format";
import { PAYMENT_METHODS } from "@/types/payment";
import type { SpecialistPayment, SpecialistPaymentPeriod } from "@/types/specialist";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "El monto es obligatorio"),
  periodStart: z.string().min(1, "La fecha de inicio es obligatoria"),
  periodEnd: z.string().min(1, "La fecha de fin es obligatoria"),
  paymentDate: z.string().min(1, "La fecha de pago es obligatoria"),
  method: z.enum(PAYMENT_METHODS),
  notes: z.string().max(191, "La nota no puede superar los 191 caracteres"),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface SpecialistPaymentFormProps {
  specialistId: number;
  /** Sueldo mensual sugerido para prellenar el monto. */
  monthlySalary?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Período a cubrir (por ejemplo, al pagar un mes pendiente). */
  period?: SpecialistPaymentPeriod | null;
  onSaved: (payment: SpecialistPayment) => void;
}

export function SpecialistPaymentForm({
  specialistId,
  monthlySalary,
  open,
  onOpenChange,
  period,
  onSaved,
}: SpecialistPaymentFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      periodStart: "",
      periodEnd: "",
      paymentDate: todayInputValue(),
      method: "EFECTIVO",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      amount: monthlySalary != null ? String(monthlySalary) : "",
      periodStart: period?.periodStart ? period.periodStart.slice(0, 10) : "",
      periodEnd: period?.periodEnd ? period.periodEnd.slice(0, 10) : "",
      paymentDate: todayInputValue(),
      method: "EFECTIVO",
      notes: "",
    });
  }, [open, period, monthlySalary, reset]);

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFormSubmit(values: PaymentFormValues) {
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("amount", { message: "El monto debe ser mayor a cero" });
      return;
    }
    if (values.periodStart > values.periodEnd) {
      setError("periodEnd", { message: "El fin del período debe ser posterior al inicio" });
      return;
    }

    try {
      const payment = await createSpecialistPayment(specialistId, {
        amount,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        paymentDate: values.paymentDate,
        method: values.method,
        notes: values.notes.trim() || undefined,
      });
      toast.success("Pago registrado");
      onSaved(payment);
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pago de sueldo</DialogTitle>
          <DialogDescription>
            Registra el sueldo u honorarios pagados al especialista por el período
            indicado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (Bs)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              {...register("amount")}
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && <p className="text-sm text-error">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodStart">Inicio del período</Label>
              <Input id="periodStart" type="date" {...register("periodStart")} />
              {errors.periodStart && (
                <p className="text-sm text-error">{errors.periodStart.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Fin del período</Label>
              <Input id="periodEnd" type="date" {...register("periodEnd")} />
              {errors.periodEnd && (
                <p className="text-sm text-error">{errors.periodEnd.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de pago</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
              {errors.paymentDate && (
                <p className="text-sm text-error">{errors.paymentDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <select id="method" className={inputClass} {...register("method")}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method === "EFECTIVO"
                      ? "Efectivo"
                      : method === "QR"
                        ? "QR"
                        : "Transferencia"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Nota (opcional)</Label>
              <Input id="notes" {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
