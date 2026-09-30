"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ScanLine,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrScanner } from "@/components/attendance/qr-scanner";
import { MonthCalendar } from "@/components/attendance/month-calendar";
import {
  listAttendanceByDate,
  listAttendanceDaysInMonth,
  scanAttendance,
  type AttendanceByDateItem,
  type AttendanceStatus,
  type ScanAttendanceResult,
} from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

/**
 * Normaliza lo que devuelve el lector. `html5-qrcode` decodifica la URL
 * completa del QR, pero el operador también puede pegar el token suelto, y en
 * algunos navegadores la URL llega con parámetros de análisis añadidos.
 */
function extractCode(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    return last ? decodeURIComponent(last) : value;
  } catch {
    // No es una URL: se asume que ya es el token.
    return value;
  }
}

const STATUS_VARIANT: Record<
  AttendanceStatus,
  "success" | "destructive" | "warning"
> = {
  PRESENTE: "success",
  AUSENTE: "destructive",
  JUSTIFICADO: "warning",
};

/** Copia un `Date` a medianoche local, como se guardan las asistencias. */
function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function AttendancePage() {
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanAttendanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calendario: el día y el mes visible seleccionados, y las asistencias ya
  // cargadas para el día. El mes lo controla la página para poder pintar los
  // puntos de los días con asistencia de ese mes.
  const [selectedDate, setSelectedDate] = useState(() => startOfLocalDay(new Date()));
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const [dayAttendance, setDayAttendance] = useState<AttendanceByDateItem[]>([]);
  const [loadedDate, setLoadedDate] = useState<Date | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  // Días del mes visible con al menos una asistencia (punto verde).
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());

  /** Mientras el día cargado no coincida con el seleccionado, está en curso. */
  const isLoadingDay =
    loadedDate === null || !isSameLocalDay(loadedDate, selectedDate);

  // Solo obtiene los datos; quien la llame decide cuándo aplicar el setState.
  // El effect y los manejadores de eventos comparten así la misma petición.
  const fetchDayRows = useCallback(async (date: Date) => {
    try {
      const rows = await listAttendanceByDate(format(date, "yyyy-MM-dd"));
      return { rows, error: null as string | null };
    } catch (err) {
      return { rows: [] as AttendanceByDateItem[], error: getErrorMessage(err) };
    }
  }, []);

  const fetchMarkedDays = useCallback(async (month: Date) => {
    try {
      const days = await listAttendanceDaysInMonth(
        month.getFullYear(),
        month.getMonth() + 1,
      );
      return new Set(days) as Set<string>;
    } catch {
      return new Set<string>();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchDayRows(selectedDate).then(({ rows, error }) => {
      if (cancelled) return;
      setDayAttendance(rows);
      setDayError(error);
      setLoadedDate(selectedDate);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, fetchDayRows]);

  // Al cambiar el mes visible, recarga los puntos de los días con asistencia.
  useEffect(() => {
    let cancelled = false;
    void fetchMarkedDays(viewMonth).then((days) => {
      if (cancelled) return;
      setMarkedDates(days);
    });
    return () => {
      cancelled = true;
    };
  }, [viewMonth, fetchMarkedDays]);

  async function register(raw: string) {
    const code = extractCode(raw);
    if (!code || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const registered = await scanAttendance(code);
      setResult(registered);
      setManualCode("");
      // Si el operador está mirando el día de hoy, recarga la lista y el punto
      // verde del calendario en caso de que sea la primera asistencia del día.
      const today = startOfLocalDay(new Date());
      if (isSameLocalDay(selectedDate, today)) {
        const [{ rows, error }, days] = await Promise.all([
          fetchDayRows(today),
          fetchMarkedDays(viewMonth),
        ]);
        setDayAttendance(rows);
        setDayError(error);
        setLoadedDate(today);
        setMarkedDates(days);
      }
    } catch (err) {
      setResult(null);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault();
    void register(manualCode);
  }

  const dayLabel = format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Asistencias</h2>
        <p className="text-muted-foreground">
          Escanea la credencial del niño para registrar su asistencia de hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="size-4" />
              Escanear credencial
            </CardTitle>
            <CardDescription>
              Apunta la cámara al QR de la tarjeta del niño.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QrScanner onScan={(value) => void register(value)} disabled={submitting} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresar carnet</CardTitle>
              <CardDescription>
                Alternativa a la cámara: escribe el carnet del niño.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manualCode">Carnet del niño</Label>
                  <Input
                    id="manualCode"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder="CI 45231876"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button type="submit" disabled={submitting || !manualCode.trim()}>
                  Registrar asistencia
                </Button>
              </form>
            </CardContent>
          </Card>

          {result && (
            <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="space-y-1">
                <p className="font-medium">
                  {result.child.name} {result.child.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.created
                    ? "Asistencia registrada por hoy."
                    : "Ya tenía asistencia registrada hoy."}
                </p>
                <Badge variant={result.created ? "success" : "secondary"}>
                  {result.attendance.status}
                </Badge>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-3 rounded-lg border border-error/40 bg-error/5 p-4">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void register(manualCode)}
                disabled={submitting || !manualCode.trim()}
              >
                <RefreshCw className="size-4" />
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4" />
            Asistencias por día
          </CardTitle>
          <CardDescription>
            Elige un día en el calendario para ver quién asistió y quién faltó.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(240px,16rem)_1fr]">
            <MonthCalendar
              selected={selectedDate}
              viewMonth={viewMonth}
              markedDates={markedDates}
              onSelect={(date) => setSelectedDate(date)}
              onMonthChange={(month) => setViewMonth(month)}
            />

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium first-letter:uppercase">
                  {dayLabel}
                </p>
                {isLoadingDay ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    aria-label="Recargar"
                    onClick={() => {
                      void fetchDayRows(selectedDate).then(({ rows, error }) => {
                        setDayAttendance(rows);
                        setDayError(error);
                        setLoadedDate(selectedDate);
                      });
                    }}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                )}
              </div>

              {!isLoadingDay && dayError && (
                <p className="rounded-lg border border-error/40 bg-error/5 p-3 text-sm text-error">
                  {dayError}
                </p>
              )}

              {!isLoadingDay && !dayError && dayAttendance.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  <Users className="size-5" />
                  <p className="text-sm">
                    No hay asistencias registradas para este día.
                  </p>
                </div>
              )}

              {!isLoadingDay && !dayError && dayAttendance.length > 0 && (
                <ul className="divide-y rounded-lg border">
                  {dayAttendance.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {record.child.name} {record.child.lastName}
                        </p>
                        <p
                          className={cn(
                            "text-xs text-muted-foreground",
                            record.notes && "line-clamp-1",
                          )}
                        >
                          CI {record.child.carnet.startsWith("CI ") ? record.child.carnet.slice(3) : record.child.carnet}
                          {record.notes && ` · ${record.notes}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {record.registeredBy.name} {record.registeredBy.lastName}
                        </span>
                        <Badge variant={STATUS_VARIANT[record.status]}>
                          {formatStatus(record.status)}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Traduce el estado a etiqueta legible en la lista. */
function formatStatus(status: AttendanceStatus): string {
  switch (status) {
    case "PRESENTE":
      return "Presente";
    case "AUSENTE":
      return "Ausente";
    case "JUSTIFICADO":
      return "Justificado";
  }
}