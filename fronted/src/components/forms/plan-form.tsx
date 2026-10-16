"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ChildSelect } from "@/components/forms/child-select";
import { SpecialistSelect } from "@/components/forms/specialist-select";
import { createPlan, updatePlan } from "@/lib/api/planning";
import { listAreas } from "@/lib/api/areas";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue, todayInputValue } from "@/lib/format";
import type { Area } from "@/types/area";
import {
  PLAN_FREQUENCIES,
  PLAN_FREQUENCY_LABELS,
  type PlanFrequency,
  type TreatmentPlan,
} from "@/types/planning";
import { useAuthStore } from "@/stores/auth-store";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const planSchema = z.object({
  frequency: z.enum(PLAN_FREQUENCIES),
  notes: z.string().max(2000, "Las notas no pueden superar los 2000 caracteres"),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Plan a editar; si no se pasa, crea uno nuevo. */
  plan?: TreatmentPlan | null;
  onSaved: () => void;
}

interface PlanFormBodyProps {
  plan?: TreatmentPlan | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PlanForm({ open, onOpenChange, plan, onSaved }: PlanFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {open && (
          <PlanFormBody
            key={plan?.id ?? "new"}
            plan={plan}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlanFormBody({ plan, onOpenChange, onSaved }: PlanFormBodyProps) {
  const isEdit = Boolean(plan);
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const [areas, setAreas] = useState<Area[]>([]);
  const [childId, setChildId] = useState<number | null>(plan?.childId ?? null);
  const [specialistId, setSpecialistId] = useState<number | null>(
    plan?.specialistId ?? null,
  );
  const [areaId, setAreaId] = useState<number | null>(plan?.areaId ?? null);
  const [startDate, setStartDate] = useState(
    plan?.startDate ? toDateInputValue(plan.startDate) : todayInputValue(),
  );
  const [endDate, setEndDate] = useState(
    plan?.endDate ? toDateInputValue(plan.endDate) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      frequency: plan?.frequency ?? "WEEKLY",
      notes: plan?.notes ?? "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listAreas();
        if (!cancelled) setAreas(data);
      } catch {
        if (!cancelled) setAreas([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFormSubmit(values: PlanFormValues) {
    setFormError(null);

    if (!childId) {
      setFormError("Selecciona un niño");
      return;
    }
    if (isAdmin && !specialistId && !isEdit) {
      setFormError("Selecciona el especialista responsable");
      return;
    }
    if (!startDate) {
      setFormError("La fecha de inicio es obligatoria");
      return;
    }
    if (endDate && startDate > endDate) {
      setFormError("La fecha de fin debe ser posterior a la de inicio");
      return;
    }

    try {
      if (isEdit && plan) {
        await updatePlan(plan.id, {
          areaId: areaId ?? undefined,
          frequency: values.frequency,
          startDate,
          endDate: endDate || undefined,
          notes: values.notes.trim() || undefined,
        });
        toast.success("Plan actualizado");
      } else {
        await createPlan({
          childId,
          specialistId: specialistId ?? undefined,
          areaId: areaId ?? undefined,
          frequency: values.frequency,
          startDate,
          endDate: endDate || undefined,
          notes: values.notes.trim() || undefined,
        });
        toast.success("Plan creado");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar plan de tratamiento" : "Nuevo plan de tratamiento"}
        </DialogTitle>
        <DialogDescription>
          Un plan agrupa las actividades a realizar con el niño. Puedes agregar los
          ítems del plan después de crearlo.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {!isEdit && <ChildSelect value={childId ?? 0} onChange={setChildId} />}

        {!isEdit && isAdmin && (
          <SpecialistSelect value={specialistId} onChange={setSpecialistId} />
        )}

        <div className="space-y-2">
          <Label htmlFor="areaId">Área (opcional)</Label>
          <select
            id="areaId"
            className={inputClass}
            value={areaId ?? ""}
            onChange={(event) =>
              setAreaId(event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">Sin área específica</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frecuencia</Label>
          <select id="frequency" className={inputClass} {...register("frequency")}>
            {PLAN_FREQUENCIES.map((frequency: PlanFrequency) => (
              <option key={frequency} value={frequency}>
                {PLAN_FREQUENCY_LABELS[frequency]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Fecha de inicio</Label>
          <DateSelects value={startDate} onChange={setStartDate} />
        </div>
        <div className="space-y-2">
          <Label>Fecha de fin (opcional)</Label>
          <DateSelects value={endDate} onChange={setEndDate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <textarea
            id="notes"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("notes")}
          />
          {errors.notes && <p className="text-sm text-error">{errors.notes.message}</p>}
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Crear plan"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
