"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { createEnrollment, getEnrollmentPrefill } from "@/lib/api/enrollments";
import { listAreas } from "@/lib/api/areas";
import { getErrorMessage } from "@/lib/axios";
import { currentMonthInputValue, todayInputValue } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/types/payment";
import type { Area } from "@/types/area";
import {
  SHIFTS,
  SHIFT_LABELS,
  WEEKDAYS,
  type Enrollment,
  type ScheduleDay,
  type Shift,
} from "@/types/enrollment";

const DURATION_PRESETS = [30, 60, 90, 180, 365];

function addDaysInput(value: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(days)) return "";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const enrollmentSchema = z.object({
  startDate: z.string().min(1, "La fecha de inscripción es obligatoria"),
  durationDays: z
    .number()
    .int("La duración debe ser un número entero de días")
    .positive("La duración debe ser mayor a cero"),
  monthlyFee: z.number().positive("La matrícula mensual debe ser mayor a cero"),
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
      startDate: todayInputValue(),
      durationDays: 90,
      monthlyFee: 0,
      notes: "",
    },
  });

  const startDateValue = useWatch({ control, name: "startDate" });
  const durationValue = useWatch({ control, name: "durationDays" });
  const computedEndDate = addDaysInput(startDateValue ?? "", Number(durationValue));

  const [areas, setAreas] = useState<Area[]>([]);
  const [areaIds, setAreaIds] = useState<number[]>([]);
  const [schedule, setSchedule] = useState<Record<number, Shift | "">>({});

  const [chargeInitial, setChargeInitial] = useState(false);
  const [initialAmount, setInitialAmount] = useState(0);
  const [initialMethod, setInitialMethod] = useState<PaymentMethod>("EFECTIVO");
  const [initialPeriod, setInitialPeriod] = useState(currentMonthInputValue());
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
        setValue("startDate", prefill.startDate);
        setValue("monthlyFee", prefill.monthlyFee);
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
      setInitialMethod("EFECTIVO");
      setInitialPeriod(currentMonthInputValue());
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
      const [year, month] = initialPeriod.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      initialPayment = {
        amount: initialAmount,
        method: initialMethod,
        periodStart: `${initialPeriod}-01`,
        periodEnd: `${initialPeriod}-${String(lastDay).padStart(2, "0")}`,
      };
    }

    try {
      const enrollment = await createEnrollment({
        childId,
        startDate: values.startDate,
        durationDays: values.durationDays,
        monthlyFee: values.monthlyFee,
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
            Inscribe a {childName} indicando la duración, la agenda semanal, las áreas y,
            si corresponde, el pago inicial.
          </DialogDescription>
        </DialogHeader>

        {warning && (
          <div className="rounded-md border border-warning/50 bg-warning/10 p-2 text-sm">
            {warning}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inscripción</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate && (
                <p className="text-sm text-error">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationDays">Duración (días)</Label>
              <Input
                id="durationDays"
                type="number"
                min="1"
                step="1"
                {...register("durationDays", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.durationDays)}
              />
              <div className="flex flex-wrap gap-1">
                {DURATION_PRESETS.map((days) => (
                  <Button
                    key={days}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() =>
                      setValue("durationDays", days, { shouldValidate: true })
                    }
                  >
                    {days} días
                  </Button>
                ))}
              </div>
              {errors.durationDays && (
                <p className="text-sm text-error">{errors.durationDays.message}</p>
              )}
              {computedEndDate && (
                <p className="text-xs text-muted-foreground">
                  Fecha de fin calculada: {computedEndDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyFee">Matrícula mensual</Label>
            <Input
              id="monthlyFee"
              type="number"
              min="0.01"
              step="0.01"
              {...register("monthlyFee", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.monthlyFee)}
            />
            {errors.monthlyFee && (
              <p className="text-sm text-error">{errors.monthlyFee.message}</p>
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
                    setInitialAmount(getValues("monthlyFee") || 0);
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="initialPeriod">Mes que cubre</Label>
                  <Input
                    id="initialPeriod"
                    type="month"
                    value={initialPeriod}
                    onChange={(event) => setInitialPeriod(event.target.value)}
                  />
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
