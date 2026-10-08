"use client";

import { useForm, Controller } from "react-hook-form";
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
import { ChildSelect } from "@/components/forms/child-select";
import { DateSelects } from "@/components/forms/date-selects";
import { createPayment } from "@/lib/api/payments";
import { currentMonthInputValue, todayInputValue } from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { PAYMENT_METHODS } from "@/types/payment";
import type { Payment } from "@/types/payment";

const paymentSchema = z.object({
  childId: z.number().int().positive("Selecciona un niño"),
  amount: z.number().positive("El monto debe ser mayor a cero"),
  paymentDate: z.string().min(1, "La fecha de pago es obligatoria"),
  method: z.enum(PAYMENT_METHODS, {
    message: "Selecciona un método",
  }),
  periodStart: z.string().min(1, "Indica el inicio del periodo"),
  periodEnd: z.string().min(1, "Indica el fin del periodo"),
  reference: z.string(),
  description: z.string(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultChildId?: number;
  onCreated: (payment: Payment) => void;
}

export function PaymentForm({
  open,
  onOpenChange,
  defaultChildId,
  onCreated,
}: PaymentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      childId: defaultChildId ?? 0,
      amount: 0,
      paymentDate: todayInputValue(),
      method: "EFECTIVO",
      periodStart: currentMonthInputValue(),
      periodEnd: currentMonthInputValue(),
      reference: "",
      description: "",
    },
  });

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function parsePeriod(value: string): { start: string; end: string } {
    const [year, month] = value.split("-").map(Number);
    const endDay = new Date(year, month, 0).getDate();
    return {
      start: `${value}-01`,
      end: `${value}-${String(endDay).padStart(2, "0")}`,
    };
  }

  async function handleFormSubmit(values: PaymentFormValues) {
    try {
      const period = parsePeriod(values.periodStart);
      const payment = await createPayment({
        childId: values.childId,
        amount: values.amount,
        paymentDate: values.paymentDate,
        method: values.method,
        periodStart: period.start,
        periodEnd: period.end,
        reference: values.reference.trim() || undefined,
        description: values.description.trim() || undefined,
      });
      toast.success("Pago registrado correctamente");
      onCreated(payment);
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Registra el cobro de una mensualidad para un niño.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Controller
            control={control}
            name="childId"
            render={({ field }) => (
              <ChildSelect
                value={field.value}
                onChange={field.onChange}
                error={errors.childId?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && <p className="text-sm text-error">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="paymentDate">Fecha de pago</Label>
              <Controller
                control={control}
                name="paymentDate"
                render={({ field }) => (
                  <DateSelects
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.paymentDate)}
                  />
                )}
              />
              {errors.paymentDate && (
                <p className="text-sm text-error">{errors.paymentDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Método</Label>
              <select id="method" className={inputClass} {...register("method")}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.method && <p className="text-sm text-error">{errors.method.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodStart">Periodo que cubre</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="periodStart"
                  type="month"
                  {...register("periodStart")}
                  aria-invalid={Boolean(errors.periodStart)}
                />
                <span className="text-muted-foreground">a</span>
                <Input id="periodEnd" type="month" {...register("periodEnd")} aria-invalid={Boolean(errors.periodEnd)} />
              </div>
              {(errors.periodStart || errors.periodEnd) && (
                <p className="text-sm text-error">
                  {errors.periodStart?.message ?? errors.periodEnd?.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia (opcional)</Label>
              <Input id="reference" {...register("reference")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Input id="description" {...register("description")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}