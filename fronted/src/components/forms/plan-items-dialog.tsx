"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPlanItem,
  deletePlanItem,
  listPlans,
  updatePlanItem,
} from "@/lib/api/planning";
import { getErrorMessage } from "@/lib/axios";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/types/enrollment";
import type { TreatmentPlan, TreatmentPlanItem } from "@/types/planning";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const ANY_DAY = "";

interface PlanItemsDialogProps {
  plan: TreatmentPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function PlanItemsDialog({
  plan,
  open,
  onOpenChange,
  onChanged,
}: PlanItemsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        {open && plan && (
          <PlanItemsBody
            key={plan.id}
            plan={plan}
            onChanged={onChanged}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlanItemsBody({
  plan,
  onChanged,
}: {
  plan: TreatmentPlan;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<TreatmentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>(ANY_DAY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const plans = await listPlans({ includeInactive: true });
        const current = plans.find((item) => item.id === plan.id);
        if (!cancelled) setItems(current?.items ?? []);
      } catch (error) {
        if (!cancelled) toast.error(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [plan.id]);

  async function handleAdd() {
    if (!title.trim()) {
      toast.error("El título del ítem es obligatorio");
      return;
    }
    try {
      setSaving(true);
      await createPlanItem(plan.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        dayOfWeek: dayOfWeek === ANY_DAY ? undefined : Number(dayOfWeek),
      });
      setTitle("");
      setDescription("");
      setDayOfWeek(ANY_DAY);
      toast.success("Ítem agregado");
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateDay(item: TreatmentPlanItem, value: string) {
    try {
      await updatePlanItem(plan.id, item.id, {
        dayOfWeek: value === ANY_DAY ? undefined : Number(value),
      });
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, dayOfWeek: value === ANY_DAY ? null : Number(value) }
            : entry,
        ),
      );
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleDelete(item: TreatmentPlanItem) {
    try {
      await deletePlanItem(plan.id, item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success("Ítem eliminado");
      onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ítems del plan</DialogTitle>
        <DialogDescription>
          Actividades que se aplican según la frecuencia del plan y el día indicado.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-title">Título</Label>
              <Input
                id="item-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-day">Día</Label>
              <select
                id="item-day"
                className={inputClass}
                value={dayOfWeek}
                onChange={(event) => setDayOfWeek(event.target.value)}
              >
                <option value={ANY_DAY}>Todos los días</option>
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="item-description">Descripción (opcional)</Label>
              <Input
                id="item-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAdd} disabled={saving}>
              <Plus className="size-4" />
              Agregar ítem
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando ítems...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este plan todavía no tiene ítems.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className={inputClass}
                    value={item.dayOfWeek ?? ANY_DAY}
                    onChange={(event) => void handleUpdateDay(item, event.target.value)}
                    aria-label={`Día de ${item.title}`}
                  >
                    <option value={ANY_DAY}>Todos los días</option>
                    {WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {WEEKDAY_LABELS[day.value]}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDelete(item)}
                    aria-label="Eliminar ítem"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
