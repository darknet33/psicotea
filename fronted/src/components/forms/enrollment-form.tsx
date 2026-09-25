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
import { createEnrollment } from "@/lib/api/enrollments";
import { getErrorMessage } from "@/lib/axios";
import type { Enrollment } from "@/types/enrollment";

const enrollmentSchema = z.object({
  childId: z.number().int().positive("Selecciona un niño"),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
  monthlyFee: z.number().positive("La matrícula mensual debe ser mayor a cero"),
  notes: z.string(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface EnrollmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultChildId?: number;
  onCreated: (enrollment: Enrollment) => void;
}

export function EnrollmentForm({
  open,
  onOpenChange,
  defaultChildId,
  onCreated,
}: EnrollmentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: { childId: defaultChildId ?? 0, startDate: "", monthlyFee: 0, notes: "" },
  });

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function handleFormSubmit(values: EnrollmentFormValues) {
    try {
      const enrollment = await createEnrollment({
        childId: values.childId,
        startDate: values.startDate,
        monthlyFee: values.monthlyFee,
        notes: values.notes.trim() || undefined,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva inscripción</DialogTitle>
          <DialogDescription>Inscribe a un niño con su matrícula mensual.</DialogDescription>
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

          <div className="space-y-2">
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <DateSelects
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.startDate)}
                />
              )}
            />
            {errors.startDate && <p className="text-sm text-error">{errors.startDate.message}</p>}
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
            {errors.monthlyFee && <p className="text-sm text-error">{errors.monthlyFee.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <textarea id="notes" className={`${inputClass} min-h-20 resize-y py-2`} {...register("notes")} />
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