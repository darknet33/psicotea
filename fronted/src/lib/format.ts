const TIME_ZONE = "America/La_Paz";

function partsInTz(date: Date): { year: string; month: string; day: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const result: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") result[part.type] = part.value;
  }
  return result as { year: string; month: string; day: string };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
  }).format(amount);
}

export function formatDate(iso?: string | null, fallback = "—"): string {
  if (!iso) return fallback;
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatAge(iso?: string | null, fallback = "—"): string {
  if (!iso) return fallback;
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return fallback;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (now.getDate() < birth.getDate()) {
    months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
  }

  const yearText = `${years} ${years === 1 ? "año" : "años"}`;
  const monthText = `${months} ${months === 1 ? "mes" : "meses"}`;

  if (years <= 0) return monthText;
  return `${yearText} ${monthText}`;
}

export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const p = partsInTz(new Date(iso));
  return `${p.year}-${p.month}-${p.day}`;
}

export function todayInputValue(): string {
  const p = partsInTz(new Date());
  return `${p.year}-${p.month}-${p.day}`;
}

export function currentMonthInputValue(): string {
  return todayInputValue().slice(0, 7);
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const p = partsInTz(new Date());
  const year = Number(p.year);
  const month = Number(p.month);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${p.year}-${p.month}-01`,
    end: `${p.year}-${p.month}-${String(lastDay).padStart(2, "0")}`,
  };
}