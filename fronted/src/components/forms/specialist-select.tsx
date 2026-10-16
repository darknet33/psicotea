"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { listSpecialists } from "@/lib/api/specialists";
import type { Specialist } from "@/types/specialist";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface SpecialistSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  /** Muestra la opción vacía (por ejemplo, para filtrar "todos"). */
  allowEmpty?: boolean;
}

export function SpecialistSelect({
  value,
  onChange,
  label = "Especialista",
  error,
  disabled,
  allowEmpty = false,
}: SpecialistSelectProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await listSpecialists({ includeInactive: false });
        if (!cancelled) setSpecialists(data);
      } catch {
        if (!cancelled) setSpecialists([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="specialist-select">{label}</Label>
      <select
        id="specialist-select"
        className={inputClass}
        value={value ?? ""}
        disabled={disabled || loading}
        onChange={(event) =>
          onChange(event.target.value ? Number(event.target.value) : null)
        }
        aria-invalid={Boolean(error)}
      >
        {(allowEmpty || value == null) && (
          <option value="">
            {loading
              ? "Cargando especialistas..."
              : allowEmpty
                ? "Todos los especialistas"
                : "Selecciona un especialista..."}
          </option>
        )}
        {specialists.map((specialist) => (
          <option key={specialist.id} value={specialist.id}>
            {specialist.user.name} {specialist.user.lastName} · {specialist.specialty}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
