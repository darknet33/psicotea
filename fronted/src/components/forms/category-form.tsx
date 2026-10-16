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
import { createCategory, updateCategory } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/axios";
import type { ExpenseCategory } from "@/types/expense";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "El nombre no puede superar los 80 caracteres"),
  description: z.string().max(191, "La descripción no puede superar los 191 caracteres"),
  color: z.string(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ExpenseCategory | null;
  onSaved: (category: ExpenseCategory) => void;
}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "", color: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: category?.name ?? "",
      description: category?.description ?? "",
      color: category?.color ?? "",
    });
  }, [open, category, reset]);

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFormSubmit(values: CategoryFormValues) {
    const color = values.color.trim();
    if (color && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      color: color || undefined,
    };

    try {
      const saved = category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      toast.success(category ? "Categoría actualizada" : "Categoría creada");
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
          <DialogTitle>
            {category ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            Las categorías clasifican los gastos del centro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-sm text-error">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Descripción (opcional)</Label>
            <Input id="category-description" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-color">Color (opcional, ej. #22c55e)</Label>
            <Input
              id="category-color"
              type="color"
              className="h-9 w-20 p-1"
              {...register("color")}
            />
            {errors.color && (
              <p className="text-sm text-error">{errors.color.message}</p>
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
              {isSubmitting ? "Guardando..." : category ? "Guardar" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
