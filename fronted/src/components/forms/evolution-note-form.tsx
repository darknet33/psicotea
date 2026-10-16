"use client";

import { useEffect, useState } from "react";
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
import { ChildSelect } from "@/components/forms/child-select";
import { SpecialistSelect } from "@/components/forms/specialist-select";
import { createEvolution, listPlans, updateEvolution } from "@/lib/api/planning";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue, todayInputValue } from "@/lib/format";
import type { EvolutionNote, TreatmentPlan } from "@/types/planning";
import { useAuthStore } from "@/stores/auth-store";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const evolutionSchema = z.object({
  date: z.string().min(1, "La fecha es obligatoria"),
  content: z
    .string()
    .trim()
    .min(1, "El contenido de la nota es obligatorio")
    .max(5000, "El contenido no puede superar los 5000 caracteres"),
  observation: z.string().max(2000, "La observación no puede superar los 2000 caracteres"),
});

type EvolutionFormValues = z.infer<typeof evolutionSchema>;

interface EvolutionNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: EvolutionNote | null;
  onSaved: () => void;
}

interface EvolutionNoteBodyProps {
  note?: EvolutionNote | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EvolutionNoteForm({
  open,
  onOpenChange,
  note,
  onSaved,
}: EvolutionNoteFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {open && (
          <EvolutionNoteBody
            key={note?.id ?? "new"}
            note={note}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EvolutionNoteBody({ note, onOpenChange, onSaved }: EvolutionNoteBodyProps) {
  const isEdit = Boolean(note);
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const [childId, setChildId] = useState<number | null>(note?.childId ?? null);
  const [specialistId, setSpecialistId] = useState<number | null>(
    note?.specialistId ?? null,
  );
  const [planId, setPlanId] = useState<number | null>(note?.planId ?? null);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EvolutionFormValues>({
    resolver: zodResolver(evolutionSchema),
    defaultValues: {
      date: note?.date ? toDateInputValue(note.date) : todayInputValue(),
      content: note?.content ?? "",
      observation: note?.observation ?? "",
    },
  });

  useEffect(() => {
    if (!childId) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await listPlans({ childId: childId ?? undefined });
        if (!cancelled) setPlans(data);
      } catch {
        if (!cancelled) setPlans([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  async function handleFormSubmit(values: EvolutionFormValues) {
    setFormError(null);

    if (!isEdit && !childId) {
      setFormError("Selecciona un niño");
      return;
    }
    if (!isEdit && isAdmin && !specialistId) {
      setFormError("Selecciona el especialista responsable");
      return;
    }

    try {
      if (isEdit && note) {
        await updateEvolution(note.id, {
          date: values.date,
          content: values.content.trim(),
          observation: values.observation.trim() || undefined,
        });
        toast.success("Nota actualizada");
      } else {
        await createEvolution({
          childId: childId as number,
          specialistId: specialistId ?? undefined,
          planId: planId ?? undefined,
          date: values.date,
          content: values.content.trim(),
          observation: values.observation.trim() || undefined,
        });
        toast.success("Nota registrada");
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
          {isEdit ? "Editar nota de evolución" : "Nueva nota de evolución"}
        </DialogTitle>
        <DialogDescription>
          Registra lo observado en la sesión. Estas notas alimentan el informe
          evolutivo.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {!isEdit && <ChildSelect value={childId ?? 0} onChange={setChildId} />}

        {!isEdit && isAdmin && (
          <SpecialistSelect value={specialistId} onChange={setSpecialistId} />
        )}

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="planId">Plan (opcional)</Label>
            <select
              id="planId"
              className={inputClass}
              value={planId ?? ""}
              disabled={!childId}
              onChange={(event) =>
                setPlanId(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Sin plan específico</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  Plan #{plan.id} · {plan.area?.name ?? "General"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-error">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Contenido</Label>
          <textarea
            id="content"
            rows={5}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("content")}
          />
          {errors.content && <p className="text-sm text-error">{errors.content.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="observation">Observación (opcional)</Label>
          <textarea
            id="observation"
            rows={2}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            {...register("observation")}
          />
          {errors.observation && (
            <p className="text-sm text-error">{errors.observation.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-error">{formError}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Registrar nota"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
