"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/** ID del contenedor que `html5-qrcode` usa para inyectar su video. */
const READER_ID = "attendance-qr-reader";

interface QrScannerProps {
  /** Se llama con el texto crudo que decodifica el QR (URL o token). */
  onScan: (value: string) => void;
  disabled?: boolean;
}

type CameraState = "starting" | "ready" | "unavailable";

/**
 * Lector de QR por cámara.
 *
 * `html5-qrcode` se importa de forma dinámica porque manipula `navigator` y el
 * DOM: importarlo en el servidor rompería el render. Se monta solo en el
 * navegador y, si la cámara no existe o el permiso se deniega, la vista
 * degrada a la entrada manual en lugar de romperse.
 */
export function QrScanner({ onScan, disabled = false }: QrScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [failureReason, setFailureReason] = useState<string | null>(null);
  // El callback se guarda en una ref para no reiniciar el lector en cada render.
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    let scanner: { stop: () => void; clear: () => void } | null = null;
    let cancelled = false;

    async function start() {
      // Sin cámara no se puede escanear: se informa y la vista sigue operativa
      // con la entrada manual.
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        setFailureReason("Este dispositivo no tiene cámara disponible.");
        return;
      }

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        const instance = new Html5Qrcode(READER_ID, {
          verbose: false,
        });
        scanner = instance;

        if (cancelled) {
          instance.clear();
          return;
        }

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            // Se ignora: html5-qrcode llama a este callback en cada frame que
            // no detecta un QR, no solo ante un error real.
          },
        );

        if (cancelled) {
          await instance.stop();
          instance.clear();
          return;
        }

        setCameraState("ready");
      } catch (error) {
        if (cancelled) return;
        setCameraState("unavailable");
        setFailureReason(describeCameraError(error));
      }
    }

    void start();

    return () => {
      cancelled = true;
      // Detener la cámara y liberar los tracks es obligatorio: si no, el
      // indicador de "grabando" sigue encendido al salir de la vista.
      void (async () => {
        try {
          await scanner?.stop();
        } catch {
          // Si nunca llegó a arrancar, `stop` falla; no importa.
        }
        scanner?.clear();

        // `stop()` suele bastar, pero si el arranque se canceló a medias el
        // stream puede quedar vivo. Se liberan los tracks explícitamente.
        const video = document.querySelector<HTMLVideoElement>(
          `#${READER_ID} video`,
        );
        const stream = video?.srcObject;
        if (stream instanceof MediaStream) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
        }
      })();
    };
  }, [disabled]);

  if (cameraState === "unavailable") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-error/40 bg-error/5 p-4 text-sm">
        <CameraOff className="mt-0.5 size-4 shrink-0 text-error" />
        <div>
          <p className="font-medium">No se pudo activar la cámara</p>
          <p className="text-muted-foreground">
            {failureReason ?? "Revisa los permisos del navegador."} Puedes escribir
            el código de la credencial manualmente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        id={READER_ID}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border bg-black"
      />
      {cameraState === "starting" && (
        <p className="text-center text-sm text-muted-foreground">
          Activando cámara...
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => window.location.reload()}
      >
        <Camera className="size-4" />
        Reiniciar cámara
      </Button>
    </div>
  );
}

/** Traduce el error de `getUserMedia` a algo que el operador entienda. */
function describeCameraError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotAllowedError") {
      return "Permiso de cámara denegado. Habilítalo en el navegador o usa la entrada manual.";
    }
    if (error.name === "NotFoundError") {
      return "No se encontró ninguna cámara conectada.";
    }
    if (error.name === "NotReadableError") {
      return "La cámara está siendo usada por otra aplicación.";
    }
  }
  return "No se pudo iniciar el lector de códigos QR.";
}
