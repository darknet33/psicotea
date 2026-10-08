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
import { createArea, updateArea } from "@/lib/api/areas";
import { getErrorMessage } from "@/lib/axios";
import type { Area } from "@/types/area";

const areaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del área es obligatorio")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  description: z
    .string()
    .max(191, "La descripción no puede superar los 191 caracteres"),
});

type AreaFormValues = z.infer<typeof areaSchema>;

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Área a editar; si no se pasa, el formulario crea una nueva. */
  area?: Area | null;
  onSaved: (area: Area) => void;
}

export function AreaForm({ open, onOpenChange, area, onSaved }: AreaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: area?.name ?? "",
      description: area?.description ?? "",
    });
  }, [open, area, reset]);

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  async function handleFormSubmit(values: AreaFormValues) {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    };

    try {
      const saved = area
        ? await updateArea(area.id, payload)
        : await createArea(payload);
      toast.success(area ? "Área actualizada" : "Área creada");
      onSaved(saved);
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{area ? "Editar área" : "Nueva área"}</DialogTitle>
          <DialogDescription>
            Las áreas son las modalidades de trabajo del centro. Se pueden
            desactivar sin perder las inscripciones que las usan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-name">Nombre</Label>
            <Input
              id="area-name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-description">Descripción (opcional)</Label>
            <Input
              id="area-description"
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p className="text-sm text-error">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : area ? "Guardar" : "Crear área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
