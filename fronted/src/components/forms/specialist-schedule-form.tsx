"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSpecialistSchedule, replaceSpecialistSchedule } from "@/lib/api/specialists";
import { getErrorMessage } from "@/lib/axios";
import { WEEKDAYS } from "@/types/enrollment";
import {
  SPECIALIST_SHIFTS,
  SPECIALIST_SHIFT_LABELS,
  type SpecialistScheduleInput,
  type SpecialistShift,
} from "@/types/specialist";

type DayMode = "none" | "shift" | "custom";

interface DayState {
  mode: DayMode;
  shift: SpecialistShift;
  startTime: string;
  endTime: string;
}

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function emptyDay(): DayState {
  return { mode: "none", shift: "MANANA", startTime: "09:00", endTime: "12:30" };
}

interface SpecialistScheduleFormProps {
  specialistId: number;
}

/**
 * Editor de horario del especialista. Cada día puede quedar sin atención
 * (se omite al guardar), con un turno predefinido o con un rango personalizado.
 */
export function SpecialistScheduleForm({ specialistId }: SpecialistScheduleFormProps) {
  const [days, setDays] = useState<Record<number, DayState>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const schedule = await getSpecialistSchedule(specialistId);
        if (cancelled) return;
        const next: Record<number, DayState> = {};
        for (const day of schedule) {
          next[day.dayOfWeek] = day.shift
            ? { mode: "shift", shift: day.shift, startTime: "09:00", endTime: "12:30" }
            : {
                mode: "custom",
                shift: "MANANA",
                startTime: day.startTime ?? "09:00",
                endTime: day.endTime ?? "12:30",
              };
        }
        setDays(next);
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
  }, [specialistId]);

  function updateDay(dayOfWeek: number, patch: Partial<DayState>) {
    setDays((current) => ({
      ...current,
      [dayOfWeek]: { ...(current[dayOfWeek] ?? emptyDay()), ...patch },
    }));
  }

  async function handleSave() {
    const payload: SpecialistScheduleInput[] = [];

    for (const { value } of WEEKDAYS) {
      const day = days[value];
      if (!day || day.mode === "none") continue;

      if (day.mode === "shift") {
        payload.push({ dayOfWeek: value, shift: day.shift });
        continue;
      }

      if (!day.startTime || !day.endTime) {
        toast.error("Completa la hora de inicio y fin en los días personalizados");
        return;
      }
      if (day.startTime >= day.endTime) {
        toast.error("La hora de inicio debe ser anterior a la de fin");
        return;
      }
      payload.push({
        dayOfWeek: value,
        startTime: day.startTime,
        endTime: day.endTime,
      });
    }

    try {
      setSaving(true);
      await replaceSpecialistSchedule(specialistId, payload);
      toast.success("Horario actualizado");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horario de atención</CardTitle>
        <CardDescription>
          Turno predefinido o rango personalizado por día. Los días sin atención se
          dejan como &quot;No atiende&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando horario...</p>
        ) : (
          <div className="space-y-3">
            {WEEKDAYS.map(({ value, label }) => {
              const day = days[value] ?? emptyDay();
              return (
                <div
                  key={value}
                  className="grid grid-cols-1 items-end gap-3 rounded-md border p-3 sm:grid-cols-[140px_180px_1fr]"
                >
                  <p className="text-sm font-medium">{label}</p>
                  <div className="space-y-1">
                    <Label htmlFor={`mode-${value}`} className="text-xs">
                      Modalidad
                    </Label>
                    <select
                      id={`mode-${value}`}
                      className={inputClass}
                      value={day.mode}
                      onChange={(event) =>
                        updateDay(value, { mode: event.target.value as DayMode })
                      }
                    >
                      <option value="none">No atiende</option>
                      <option value="shift">Turno</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  {day.mode === "shift" && (
                    <select
                      className={inputClass}
                      value={day.shift}
                      onChange={(event) =>
                        updateDay(value, { shift: event.target.value as SpecialistShift })
                      }
                    >
                      {SPECIALIST_SHIFTS.map((shift) => (
                        <option key={shift} value={shift}>
                          {SPECIALIST_SHIFT_LABELS[shift]}
                        </option>
                      ))}
                    </select>
                  )}

                  {day.mode === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        className={inputClass}
                        value={day.startTime}
                        onChange={(event) =>
                          updateDay(value, { startTime: event.target.value })
                        }
                        aria-label={`Inicio ${label}`}
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <input
                        type="time"
                        className={inputClass}
                        value={day.endTime}
                        onChange={(event) =>
                          updateDay(value, { endTime: event.target.value })
                        }
                        aria-label={`Fin ${label}`}
                      />
                    </div>
                  )}

                  {day.mode === "none" && (
                    <p className="text-sm text-muted-foreground">Sin atención</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar horario"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
