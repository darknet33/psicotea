"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { listChildren } from "@/lib/api/children";
import type { Child } from "@/types/child";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface ChildSelectProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}

export function ChildSelect({ value, onChange, error, disabled }: ChildSelectProps) {
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    listChildren()
      .then(setChildren)
      .catch(() => setChildren([]));
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="child-select">Niño</Label>
      <select
        id="child-select"
        className={inputClass}
        value={value || ""}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
      >
        <option value="" disabled>
          Selecciona un niño...
        </option>
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name} {child.lastName}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}