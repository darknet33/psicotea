"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface DateSelectsProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseIso(value?: string): { day: string; month: string; year: string } {
  if (!value) return { day: "", month: "", year: "" };
  const [year, month, day] = value.split("-");
  return { day: day ?? "", month: month ?? "", year: year ?? "" };
}

export function DateSelects({
  value,
  onChange,
  placeholder,
  invalid,
}: DateSelectsProps) {
  const [selection, setSelection] = useState(() => parseIso(value));
  const lastEmitted = useRef(value);

  useLayoutEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setSelection(parseIso(value));
    }
  }, [value]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 100; y -= 1) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const maxDays =
    selection.day && selection.month && selection.year
      ? daysInMonth(Number(selection.year), Number(selection.month))
      : 31;

  function emit(nextDay: string, nextMonth: string, nextYear: string) {
    if (nextDay && nextMonth && nextYear) {
      const composed = `${nextYear}-${nextMonth.padStart(2, "0")}-${nextDay.padStart(2, "0")}`;
      lastEmitted.current = composed;
      onChange(composed);
    } else {
      lastEmitted.current = "";
      onChange("");
    }
  }

  function handleDay(next: string) {
    setSelection((prev) => ({ ...prev, day: next }));
    emit(next, selection.month, selection.year);
  }

  function handleMonth(next: string) {
    const max = next && selection.year
      ? daysInMonth(Number(selection.year), Number(next))
      : 31;
    const safeDay =
      selection.day && Number(selection.day) > max ? String(max) : selection.day;
    setSelection((prev) => ({ ...prev, day: safeDay, month: next }));
    emit(safeDay, next, selection.year);
  }

  function handleYear(next: string) {
    const max = next && selection.month
      ? daysInMonth(Number(next), Number(selection.month))
      : 31;
    const safeDay =
      selection.day && Number(selection.day) > max ? String(max) : selection.day;
    setSelection((prev) => ({ ...prev, day: safeDay, year: next }));
    emit(safeDay, selection.month, next);
  }

  return (
    <div
      className="grid grid-cols-3 gap-2"
      data-invalid={invalid ? true : undefined}
    >
      <div className="space-y-1">
        <Label>Día</Label>
        <select
          className={selectClass}
          value={selection.day}
          onChange={(e) => handleDay(e.target.value)}
          aria-invalid={Boolean(invalid)}
        >
          <option value="">—</option>
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={String(d)}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Mes</Label>
        <select
          className={selectClass}
          value={selection.month}
          onChange={(e) => handleMonth(e.target.value)}
          aria-invalid={Boolean(invalid)}
        >
          <option value="">—</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1)}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Año</Label>
        <select
          className={selectClass}
          value={selection.year}
          onChange={(e) => handleYear(e.target.value)}
          aria-invalid={Boolean(invalid)}
        >
          <option value="">—</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
      {placeholder ? (
        <p className="col-span-3 text-xs text-muted-foreground">{placeholder}</p>
      ) : null}
    </div>
  );
}