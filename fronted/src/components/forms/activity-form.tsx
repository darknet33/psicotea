"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { createActivity, updateActivity } from "@/lib/api/activities";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";
import type { Activity } from "@/types/activity";

const inputClass =
  "flex min-h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const activitySchema = z.object({
  childId: z.string(),
  date: z.string(),
  title: z
    .string()
    .trim()
    .min(1, "El nombre de la actividad es obligatorio")
    .max(120, "El título no puede superar los 120 caracteres"),
  description: z.string().max(2000, "La descripción no puede superar los 2000 caracteres"),
  duration: z.string(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSaved: () => void;
}

export function ActivityForm({
  open,
  onOpenChange,
  activity,
  onSaved,
}: ActivityFormProps) {
  const role = useAuthStore((state) => state.user?.role);
  const isSpecialist = role === "ESPECIALISTA";

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      childId: "",
      date: "",
      title: "",
      description: "",
      duration: "",
    },
  });

  const childId = useWatch({ control, name: "childId" });
  const date = useWatch({ control, name: "date" });

  useEffect(() => {
    if (!open) return;
    reset({
      childId: activity?.childId ? String(activity.childId) : "",
      date: activity?.date ? toDateInputValue(activity.date) : "",
      title: activity?.title ?? "",
      description: activity?.description ?? "",
      duration: activity?.duration != null ? String(activity.duration) : "",
    });
  }, [open, activity, reset]);

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFormSubmit(values: ActivityFormValues) {
    if (!values.childId) {
      setError("childId", { message: "Selecciona un niño" });
      return;
    }
    if (!values.date) {
      setError("date", { message: "Indica la fecha de la actividad" });
      return;
    }

    const duration = values.duration.trim() ? Number(values.duration) : undefined;
    if (duration !== undefined && (!Number.isInteger(duration) || duration <= 0)) {
      setError("duration", {
        message: "La duración debe ser un número entero de minutos",
      });
      return;
    }

    const payload = {
      childId: Number(values.childId),
      date: values.date,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      duration,
    };

    try {
      if (activity) {
        await updateActivity(activity.id, payload);
        toast.success("Actividad actualizada");
      } else {
        await createActivity(payload);
        toast.success("Actividad registrada");
      }
      onSaved();
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? "Editar actividad" : "Nueva actividad"}</DialogTitle>
          <DialogDescription>
            Registra la actividad de la jornada para el niño.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <ChildSelect
            value={childId ? Number(childId) : 0}
            onChange={(value) => setValue("childId", value ? String(value) : "")}
            error={errors.childId?.message}
          />

          <div className="space-y-2">
            <label htmlFor="activity-title" className="text-sm font-medium">
              Nombre de la actividad
            </label>
            <input
              id="activity-title"
              className={inputClass}
              {...register("title")}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <p className="text-sm text-error">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <DateSelects
                value={date}
                onChange={(value) => setValue("date", value)}
              />
              {errors.date && (
                <p className="text-sm text-error">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="activity-duration" className="text-sm font-medium">
                Duración (min, opcional)
              </label>
              <input
                id="activity-duration"
                type="number"
                min={1}
                className={inputClass}
                {...register("duration")}
                aria-invalid={Boolean(errors.duration)}
              />
              {errors.duration && (
                <p className="text-sm text-error">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="activity-description" className="text-sm font-medium">
              Descripción (opcional)
            </label>
            <textarea
              id="activity-description"
              rows={4}
              className={inputClass}
              {...register("description")}
            />
          </div>

          {isSpecialist && (
            <p className="text-xs text-muted-foreground">
              La actividad quedará registrada a tu nombre como responsable.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : activity
                  ? "Guardar"
                  : "Registrar actividad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
