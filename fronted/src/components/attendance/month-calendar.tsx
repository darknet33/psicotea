"use client";

import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

interface MonthCalendarProps {
  /** Día seleccionado (hora local, sin importar la hora del `Date`). */
  selected: Date;
  /** Primer día del mes visible; lo controla el padre. */
  viewMonth: Date;
  /** Días con asistencia como `AAAA-MM-DD`; se marcan con un punto verde. */
  markedDates: Set<string>;
  /** Se llama al hacer clic en un día del mes visible. */
  onSelect: (date: Date) => void;
  /** Se llama al cambiar de mes visible (prev/next o click en día aledaño). */
  onMonthChange: (month: Date) => void;
}

/**
 * Calendario mensual simple: navegación por mes y un clic en un día lo
 * selecciona. Los días con asistencias registradas se marcan con un punto
 * verde. Las semanas empiezan en lunes y los nombres de mes van en español,
 * porque el sistema opera en Bolivia.
 */
export function MonthCalendar({
  selected,
  viewMonth,
  markedDates,
  onSelect,
  onMonthChange,
}: MonthCalendarProps) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          aria-label="Mes anterior"
          onClick={() => onMonthChange(subMonths(viewMonth, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-semibold capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: es })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          aria-label="Mes siguiente"
          onClick={() => onMonthChange(addMonths(viewMonth, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="text-xs font-medium text-muted-foreground"
          >
            {weekday}
          </span>
        ))}

        {days.map((day) => {
          const dayOfMonth = format(day, "d");
          const inViewMonth = isSameMonth(day, viewMonth);
          const active = isSameDay(day, selected);
          const current = isToday(day);
          const marked =
            inViewMonth && markedDates.has(format(day, "yyyy-MM-dd"));

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => {
                onSelect(day);
                if (!isSameMonth(day, viewMonth)) {
                  onMonthChange(startOfMonth(day));
                }
              }}
              className={cn(
                "flex size-9 flex-col items-center justify-center rounded-md text-sm transition-colors",
                !inViewMonth && "text-muted-foreground/40",
                inViewMonth && !active && "hover:bg-muted",
                current && !active && "ring-1 ring-inset ring-primary/40",
                active &&
                  "bg-primary font-semibold text-primary-foreground hover:bg-primary",
              )}
              title={marked ? "Tiene asistencias" : undefined}
            >
              {dayOfMonth}
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 size-1 rounded-full",
                  marked ? "bg-success" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}