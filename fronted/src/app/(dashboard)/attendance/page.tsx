"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { QrScanner } from "@/components/attendance/qr-scanner";
import { scanAttendance, type ScanAttendanceResult } from "@/lib/api/attendance";
import { getErrorMessage } from "@/lib/axios";

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

export default function AttendancePage() {
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScanAttendanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function register(raw: string) {
    const code = extractCode(raw);
    if (!code || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      setResult(await scanAttendance(code));
      setManualCode("");
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
              <CardTitle className="text-base">Ingresar código manual</CardTitle>
              <CardDescription>
                Alternativa a la cámara, útil si el QR está dañado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="manualCode">Código de la credencial</Label>
                  <Input
                    id="manualCode"
                    value={manualCode}
                    onChange={(event) => setManualCode(event.target.value)}
                    placeholder="abc123.def456 o la URL completa"
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
    </div>
  );
}
