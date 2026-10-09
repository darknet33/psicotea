"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { DateSelects } from "@/components/forms/date-selects";
import { createPayment } from "@/lib/api/payments";
import { getEnrollmentSummary } from "@/lib/api/enrollments";
import { getChildren } from "@/lib/api/children";
import {
  currentMonthInputValue,
  formatDate,
  formatPrice,
  todayInputValue,
} from "@/lib/format";
import { getErrorMessage } from "@/lib/axios";
import { PAYMENT_METHODS } from "@/types/payment";
import type { Payment, PaymentAllocationInput } from "@/types/payment";
import { enrollmentTypeLabel, type Enrollment } from "@/types/enrollment";
import type { Child } from "@/types/child";

const paymentSchema = z
  .object({
    childId: z.number().int().positive("Selecciona un niño"),
    amount: z
      .number({ message: "El monto debe ser mayor a cero" })
      .positive("El monto debe ser mayor a cero"),
    paymentDate: z.string().min(1, "La fecha de pago es obligatoria"),
    method: z.enum(PAYMENT_METHODS, {
      message: "Selecciona un método",
    }),
    periodStart: z.string().min(1, "Indica el inicio del período"),
    periodEnd: z.string().min(1, "Indica el fin del período"),
    reference: z.string(),
    description: z.string(),
  })
  .refine(
    (values) =>
      !values.periodStart || !values.periodEnd || values.periodStart <= values.periodEnd,
    {
      message: "El fin del período no puede ser anterior al inicio",
      path: ["periodEnd"],
    },
  );

type PaymentFormValues = z.infer<typeof paymentSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function toCents(value: number): number {
  return Math.round(value * 100);
}

function monthEnd(month: string): string {
  const [year, value] = month.split("-").map(Number);
  const lastDay = new Date(year, value, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

/**
 * Propone la distribución del pago en centavos: primero la deuda más antigua
 * (`startDate asc`) y el excedente a la inscripción más reciente. Replica la
 * lógica del backend para que el usuario vea el reparto antes de confirmar.
 */
function suggestAllocations(
  obligations: Enrollment[],
  amount: number,
): Record<number, number> {
  const result: Record<number, number> = {};
  let remaining = toCents(amount);

  if (remaining <= 0 || obligations.length === 0) return result;

  for (const enrollment of obligations) {
    if (remaining <= 0) break;
    const saldo = toCents(enrollment.saldo);
    if (saldo > 0) {
      const apply = Math.min(saldo, remaining);
      result[enrollment.id] = apply / 100;
      remaining -= apply;
    }
  }

  if (remaining > 0) {
    const mostRecent = obligations[obligations.length - 1];
    result[mostRecent.id] = ((result[mostRecent.id] ?? 0) * 100 + remaining) / 100;
  }

  return result;
}

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultChildId?: number;
  child?: { id: number; firstName: string; lastName?: string; name?: string } | null;
  onCreated: (payment: Payment) => void;
}

export function PaymentForm({
  open,
  onOpenChange,
  defaultChildId,
  child,
  onCreated,
}: PaymentFormProps) {
  const fixedChild = Boolean(child);
  const resolvedChildId = fixedChild ? child?.id : defaultChildId;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      childId: resolvedChildId ?? 0,
      amount: 0,
      paymentDate: todayInputValue(),
      method: "EFECTIVO",
      periodStart: `${currentMonthInputValue()}-01`,
      periodEnd: monthEnd(currentMonthInputValue()),
      reference: "",
      description: "",
    },
  });

  const childIdValue = useWatch({ control, name: "childId" });
  const amountValue = useWatch({ control, name: "amount" });

  const [obligations, setObligations] = useState<Enrollment[]>([]);
  const [loadedChildId, setLoadedChildId] = useState<number | null>(null);
  const [loadingObligations, setLoadingObligations] = useState(false);
  const [overrides, setOverrides] = useState<{
    key: string;
    values: Record<number, number>;
  } | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [, setLoadingChildren] = useState(false);

  const buildDefaults = useCallback(
    (): PaymentFormValues => ({
      childId: resolvedChildId ?? 0,
      amount: 0,
      paymentDate: todayInputValue(),
      method: "EFECTIVO",
      periodStart: `${currentMonthInputValue()}-01`,
      periodEnd: monthEnd(currentMonthInputValue()),
      reference: "",
      description: "",
    }),
    [resolvedChildId],
  );

  useEffect(() => {
    if (open) reset(buildDefaults());
  }, [open, buildDefaults, reset]);

  // Carga las inscripciones del niño y propone el período que cubre el pago.
  useEffect(() => {
    if (!open || !childIdValue) return;

    let cancelled = false;

    async function load() {
      setLoadingObligations(true);
      try {
        const summary = await getEnrollmentSummary(childIdValue);
        if (cancelled) return;
        setObligations(summary.enrollments);
        setLoadedChildId(childIdValue);

        const reference = summary.active ?? summary.enrollments[summary.enrollments.length - 1];
        if (reference) {
          setValue("periodStart", reference.startDate.slice(0, 10));
          setValue(
            "periodEnd",
            (reference.endDate ?? reference.startDate).slice(0, 10),
          );
        }
      } catch (error) {
        if (cancelled) return;
        setObligations([]);
        setLoadedChildId(childIdValue);
        toast.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoadingObligations(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, childIdValue, setValue]);

  // Si es niño fijo, no permitir cambiarlo
  useEffect(() => {
    if (fixedChild && child?.id) {
      setValue("childId", child.id);
    }
  }, [fixedChild, child, setValue]);

  useEffect(() => {
    if (fixedChild) return;
    if (!open) return;

    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        const data = await getChildren();
        if (!cancelled) setChildrenList(data);
      } catch {
        if (!cancelled) setChildrenList([]);
      } finally {
        if (!cancelled) setLoadingChildren(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fixedChild, open]);

  // Sin buscador para evitar bugs en el selector

  const currentObligations = useMemo(
    () =>
      loadedChildId !== null && loadedChildId === childIdValue ? obligations : [],
    [loadedChildId, childIdValue, obligations],
  );

  const suggestion = useMemo(
    () => suggestAllocations(currentObligations, amountValue),
    [currentObligations, amountValue],
  );

  const signature = `${childIdValue}|${currentObligations
    .map((enrollment) => enrollment.id)
    .join(",")}|${Number.isFinite(amountValue) ? amountValue : 0}`;

  const allocations = overrides && overrides.key === signature ? overrides.values : suggestion;

  const appliedCents = Object.values(allocations).reduce(
    (sum, value) => sum + (Number.isFinite(value) ? toCents(value) : 0),
    0,
  );
  const amountCents = Number.isFinite(amountValue) ? toCents(amountValue) : 0;
  const mismatch = currentObligations.length > 0 && appliedCents !== amountCents;

  function handleClose(next: boolean) {
    if (!next) {
      reset(buildDefaults());
      setObligations([]);
      setLoadedChildId(null);
      setOverrides(null);
      setAllocationError(null);
    }
    onOpenChange(next);
  }

  function setAllocation(enrollmentId: number, value: number) {
    setOverrides({
      key: signature,
      values: { ...allocations, [enrollmentId]: value },
    });
    setAllocationError(null);
  }

  function applyOldestFirst() {
    setOverrides(null);
    setAllocationError(null);
  }

  function applyToActive() {
    const active = currentObligations.find((enrollment) => enrollment.vigente);
    if (!active) {
      applyOldestFirst();
      return;
    }
    setOverrides({ key: signature, values: { [active.id]: amountValue } });
    setAllocationError(null);
  }

  async function handleFormSubmit(values: PaymentFormValues) {
    const explicit: PaymentAllocationInput[] = currentObligations
      .map((enrollment) => ({
        enrollmentId: enrollment.id,
        amount: allocations[enrollment.id] ?? 0,
      }))
      .filter(
        (allocation) =>
          Number.isFinite(allocation.amount) && allocation.amount > 0,
      );

    if (currentObligations.length === 0) {
      toast.error("El niño no tiene inscripciones a las que aplicar el pago");
      return;
    }

    const applied = explicit.reduce((sum, item) => sum + toCents(item.amount), 0);
    if (applied !== toCents(values.amount)) {
      setAllocationError(
        "La suma de las aplicaciones debe ser igual al monto del pago",
      );
      return;
    }

    try {
      const payment = await createPayment({
        childId: values.childId,
        amount: values.amount,
        paymentDate: values.paymentDate,
        method: values.method,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        allocations: explicit,
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Registra el monto recibido indicando a qué obligación o período corresponde.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {fixedChild ? (
            <div className="space-y-2">
              <Label>Niño</Label>
              <Input
                value={`${child?.name ?? ""} ${child?.lastName ?? ""}`.trim() || `Niño #${child?.id}`}
                disabled
              />
            </div>
          ) : (
            <Controller
              control={control}
              name="childId"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Niño</Label>
                  <select
                    className={inputClass}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Selecciona un niño...
                    </option>
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.childId?.message && (
                    <p className="text-sm text-error">{errors.childId?.message}</p>
                  )}
                </div>
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto recibido</Label>
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

            <div className="space-y-2 sm:col-span-2">
              <Label>Período correspondiente</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  {...register("periodStart")}
                  aria-invalid={Boolean(errors.periodStart)}
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="date"
                  {...register("periodEnd")}
                  aria-invalid={Boolean(errors.periodEnd)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El período al que corresponde el pago es independiente de la fecha de pago.
              </p>
              {(errors.periodStart || errors.periodEnd) && (
                <p className="text-sm text-error">
                  {errors.periodStart?.message ?? errors.periodEnd?.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Destino del pago</Label>
              {currentObligations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={applyOldestFirst}>
                    Repartir por antigüedad
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={applyToActive}>
                    Aplicar a la inscripción activa
                  </Button>
                </div>
              )}
            </div>

            {!childIdValue ? (
              <p className="text-sm text-muted-foreground">
                Selecciona un niño para ver sus obligaciones.
              </p>
            ) : loadingObligations ? (
              <p className="text-sm text-muted-foreground">Cargando obligaciones...</p>
            ) : currentObligations.length === 0 ? (
              <p className="text-sm text-error">
                El niño no tiene inscripciones a las que aplicar el pago.
              </p>
            ) : (
              <div className="divide-y rounded-md border">
                {currentObligations.map((enrollment) => {
                  const applied = allocations[enrollment.id] ?? 0;
                  const resulting =
                    enrollment.saldo - (Number.isFinite(applied) ? applied : 0);
                  return (
                    <div
                      key={enrollment.id}
                      className="grid grid-cols-1 gap-2 p-2 text-sm sm:grid-cols-[1fr_auto_7rem_7rem] sm:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {enrollmentTypeLabel(enrollment.type)} ·{" "}
                          {formatDate(enrollment.startDate)} a{" "}
                          {enrollment.endDate
                            ? formatDate(enrollment.endDate)
                            : "presente"}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {enrollment.vigente ? (
                            <Badge variant="success">Inscripción activa</Badge>
                          ) : (
                            <Badge variant="warning">Deuda anterior</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Saldo pendiente: {formatPrice(enrollment.saldo)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground sm:text-right">
                        Aplicar
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={Number.isFinite(applied) && applied !== 0 ? applied : ""}
                        placeholder="0.00"
                        onChange={(event) =>
                          setAllocation(
                            enrollment.id,
                            event.target.value === "" ? 0 : Number(event.target.value),
                          )
                        }
                      />
                      <div className="text-xs text-muted-foreground">
                        Saldo resultante:{" "}
                        <span className={resulting > 0 ? "text-warning" : "text-success"}>
                          {formatPrice(resulting)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentObligations.length > 0 && (
              <p className={`text-xs ${mismatch ? "text-error" : "text-muted-foreground"}`}>
                Total aplicado: {formatPrice(appliedCents / 100)} de{" "}
                {formatPrice(Number.isFinite(amountValue) ? amountValue : 0)}
              </p>
            )}
            {allocationError && <p className="text-sm text-error">{allocationError}</p>}
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
            <Button
              type="submit"
              disabled={isSubmitting || currentObligations.length === 0 || mismatch}
            >
              {isSubmitting ? "Registrando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
