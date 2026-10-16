"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { DateSelects } from "@/components/forms/date-selects";
import { createEnrollment, getEnrollmentPrefill } from "@/lib/api/enrollments";
import { listAreas } from "@/lib/api/areas";
import { getErrorMessage } from "@/lib/axios";
import { formatDate, todayInputValue } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/types/payment";
import type { Area } from "@/types/area";
import {
  ENROLLMENT_TYPES,
  ENROLLMENT_TYPE_LABELS,
  SHIFTS,
  SHIFT_LABELS,
  WEEKDAYS,
  enrollmentTypeDays,
  type Enrollment,
  type ScheduleDay,
  type Shift,
} from "@/types/enrollment";

function addDaysInput(value: string, days: number | null): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !days || !Number.isFinite(days)) {
    return "";
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const enrollmentSchema = z.object({
  type: z.enum(ENROLLMENT_TYPES, {
    message: "Selecciona el tipo de inscripción",
  }),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  amount: z
    .number({ message: "El monto de la inscripción debe ser mayor a cero" })
    .positive("El monto de la inscripción debe ser mayor a cero"),
  notes: z.string(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface EnrollmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: number;
  childName: string;
  warning?: string;
  onCreated: (enrollment: Enrollment) => void;
}

export function EnrollmentForm({
  open,
  onOpenChange,
  childId,
  childName,
  warning,
  onCreated,
}: EnrollmentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      type: "MENSUAL",
      startDate: todayInputValue(),
      amount: 0,
      notes: "",
    },
  });

  const typeValue = useWatch({ control, name: "type" });
  const startDateValue = useWatch({ control, name: "startDate" });
  const durationDays = enrollmentTypeDays(typeValue);
  const computedEndDate = addDaysInput(startDateValue ?? "", durationDays);

  const [areas, setAreas] = useState<Area[]>([]);
  const [areaIds, setAreaIds] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<Record<number, Shift | "">>({});

  const [chargeInitial, setChargeInitial] = useState(false);
  const [initialAmount, setInitialAmount] = useState(0);
  const [initialPaymentDate, setInitialPaymentDate] = useState(todayInputValue());
  const [initialMethod, setInitialMethod] = useState<PaymentMethod>("EFECTIVO");
  const [initialError, setInitialError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await listAreas();
        if (cancelled) return;
        setAreas(data);
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      try {
        const prefill = await getEnrollmentPrefill(childId);
        if (cancelled) return;
        setValue("type", prefill.type ?? "MENSUAL");
        setValue("startDate", prefill.startDate);
        setValue("amount", prefill.amount);
        setAreaIds(prefill.areaIds);
        setSchedule(
          Object.fromEntries(
            prefill.scheduleDays.map((day) => [day.dayOfWeek, day.shift]),
          ),
        );
      } catch {
        // Sin inscripciones previas: se parte de un formulario en blanco.
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, childId, setValue]);

  function handleClose(next: boolean) {
    if (!next) {
      reset();
      setAreaIds([]);
      setSchedule({});
      setChargeInitial(false);
      setInitialAmount(0);
      setInitialPaymentDate(todayInputValue());
      setInitialMethod("EFECTIVO");
      setInitialError(null);
    }
    onOpenChange(next);
  }

  function toggleArea(id: number) {
    setAreaIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  async function handleFormSubmit(values: EnrollmentFormValues) {
    const scheduleDays: ScheduleDay[] = Object.entries(schedule)
      .filter(([, shift]) => shift !== "")
      .map(([day, shift]) => ({ dayOfWeek: Number(day), shift: shift as Shift }));

    let initialPayment;
    if (chargeInitial) {
      if (!Number.isFinite(initialAmount) || initialAmount <= 0) {
        setInitialError("El monto del pago inicial debe ser mayor a cero");
        return;
      }
      if (initialAmount > values.amount) {
        setInitialError("El pago inicial no puede superar el monto de la inscripción");
        return;
      }
      // El pago inicial cubre el período completo de la inscripción.
      if (!computedEndDate) {
        setInitialError("Indica una fecha de inicio válida para calcular el período");
        return;
      }
      initialPayment = {
        amount: initialAmount,
        paymentDate: initialPaymentDate,
        method: initialMethod,
        periodStart: values.startDate,
        periodEnd: computedEndDate,
      };
    }

    try {
      const enrollment = await createEnrollment({
        childId,
        type: values.type,
        startDate: values.startDate,
        amount: values.amount,
        notes: values.notes.trim() || undefined,
        areaIds: areaIds.length ? areaIds : undefined,
        scheduleDays: scheduleDays.length ? scheduleDays : undefined,
        initialPayment,
      });
      toast.success("Inscripción creada correctamente");
      onCreated(enrollment);
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva inscripción</DialogTitle>
          <DialogDescription>
            Inscribe a {childName} indicando el tipo, el monto de la inscripción, la
            agenda semanal, las áreas y, si corresponde, el pago inicial.
          </DialogDescription>
        </DialogHeader>

        {warning && (
          <div className="rounded-md border border-warning/50 bg-warning/10 p-2 text-sm">
            {warning}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de inscripción</Label>
              <select
                id="type"
                className={inputClass}
                {...register("type")}
                aria-invalid={Boolean(errors.type)}
              >
                {ENROLLMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ENROLLMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-error">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DateSelects
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.startDate)}
                  />
                )}
              />
              {errors.startDate && (
                <p className="text-sm text-error">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duración (solo lectura)</Label>
              <Input
                readOnly
                disabled
                value={durationDays ? `${durationDays} días` : "—"}
              />
              <p className="text-xs text-muted-foreground">
                Fecha de finalización:{" "}
                {computedEndDate ? formatDate(computedEndDate) : "—"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto de la inscripción</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.amount)}
            />
            <p className="text-xs text-muted-foreground">
              Monto para todo el período de la inscripción. No es una cuota mensual.
            </p>
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Agenda semanal</Label>
            <p className="text-xs text-muted-foreground">
              Elige el turno de cada día en el que asiste el niño.
            </p>
            <div className="divide-y rounded-lg border">
              {WEEKDAYS.map((day) => (
                <div
                  key={day.value}
                  className="flex items-center justify-between gap-3 p-2"
                >
                  <span className="text-sm">{day.label}</span>
                  <select
                    aria-label={`Turno del ${day.label}`}
                    className={`${inputClass} w-44`}
                    value={schedule[day.value] ?? ""}
                    onChange={(event) =>
                      setSchedule((prev) => ({
                        ...prev,
                        [day.value]: event.target.value as Shift | "",
                      }))
                    }
                  >
                    <option value="">No asiste</option>
                    {SHIFTS.map((shift) => (
                      <option key={shift} value={shift}>
                        {SHIFT_LABELS[shift]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Áreas de trabajo</Label>
            {areas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay áreas activas. Créalas en la sección Áreas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {areas.map((area) => (
                  <label
                    key={area.id}
                    className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={areaIds.includes(area.id)}
                      onChange={() => toggleArea(area.id)}
                    />
                    {area.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4"
                checked={chargeInitial}
                onChange={(event) => {
                  setChargeInitial(event.target.checked);
                  setInitialError(null);
                  if (event.target.checked && initialAmount === 0) {
                    setInitialAmount(getValues("amount") || 0);
                  }
                }}
              />
              Registrar pago inicial
            </label>

            {chargeInitial && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">Monto</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={initialAmount}
                    onChange={(event) => setInitialAmount(Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialPaymentDate">Fecha de pago</Label>
                  <DateSelects
                    value={initialPaymentDate}
                    onChange={setInitialPaymentDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialMethod">Método</Label>
                  <select
                    id="initialMethod"
                    className={inputClass}
                    value={initialMethod}
                    onChange={(event) =>
                      setInitialMethod(event.target.value as PaymentMethod)
                    }
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Período correspondiente</Label>
                  <p className="text-sm text-muted-foreground">
                    {startDateValue ? formatDate(startDateValue) : "—"} a{" "}
                    {computedEndDate ? formatDate(computedEndDate) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cubre el período completo de la inscripción.
                  </p>
                </div>
              </div>
            )}
            {initialError && <p className="text-sm text-error">{initialError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea
              id="notes"
              className={`${inputClass} min-h-20 resize-y py-2`}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear inscripción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
