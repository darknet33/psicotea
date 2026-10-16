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
import { DateSelects } from "@/components/forms/date-selects";
import { createExpense, listCategories, updateExpense } from "@/lib/api/expenses";
import { getErrorMessage } from "@/lib/axios";
import { toDateInputValue } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/types/expense";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const expenseSchema = z.object({
  categoryId: z.string(),
  amount: z.string(),
  date: z.string(),
  description: z.string().max(191, "La descripción no puede superar los 191 caracteres"),
  receiptUrl: z.string().max(255, "La URL no puede superar los 255 caracteres"),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSaved: () => void;
}

export function ExpenseForm({
  open,
  onOpenChange,
  expense,
  onSaved,
}: ExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      date: "",
      description: "",
      receiptUrl: "",
    },
  });

  const date = useWatch({ control, name: "date" });

  useEffect(() => {
    if (!open) return;
    reset({
      categoryId: expense?.categoryId ? String(expense.categoryId) : "",
      amount: expense ? String(expense.amount) : "",
      date: expense?.date ? toDateInputValue(expense.date) : "",
      description: expense?.description ?? "",
      receiptUrl: expense?.receiptUrl ?? "",
    });
  }, [open, expense, reset]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    listCategories(false)
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFormSubmit(values: ExpenseFormValues) {
    const amount = Number(values.amount);

    if (!values.categoryId) {
      setError("categoryId", { message: "Selecciona una categoría" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("amount", { message: "El monto debe ser mayor a cero" });
      return;
    }
    if (!values.date) {
      setError("date", { message: "Indica la fecha del gasto" });
      return;
    }

    const payload = {
      categoryId: Number(values.categoryId),
      amount,
      date: values.date,
      description: values.description.trim() || undefined,
      receiptUrl: values.receiptUrl.trim() || undefined,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, payload);
        toast.success("Gasto actualizado");
      } else {
        await createExpense(payload);
        toast.success("Gasto registrado");
      }
      onSaved();
      handleClose(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
          <DialogDescription>
            Registra el gasto con su categoría, monto y fecha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-category">Categoría</Label>
            <select
              id="expense-category"
              className={inputClass}
              {...register("categoryId")}
              aria-invalid={Boolean(errors.categoryId)}
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-sm text-error">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Monto</Label>
            <Input
              id="expense-amount"
              inputMode="decimal"
              {...register("amount")}
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && (
              <p className="text-sm text-error">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <DateSelects
              value={date}
              onChange={(value) => setValue("date", value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Descripción (opcional)</Label>
            <Input id="expense-description" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-receipt">Comprobante URL (opcional)</Label>
            <Input id="expense-receipt" {...register("receiptUrl")} />
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
              {isSubmitting ? "Guardando..." : expense ? "Guardar" : "Registrar gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
