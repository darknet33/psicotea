"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CredentialQr } from "@/components/credential/credential-qr";
import { getChild, type ChildDetail } from "@/lib/api/children";
import { getErrorMessage } from "@/lib/axios";
import { isLegacyCarnet } from "@/lib/carnet";

/**
 * El origen no cambia durante la vida de la página, así que `subscribe` no
 * tiene nada que observar. El snapshot del servidor es `""` para que el HTML
 * inicial no contenga un href que no existe en el servidor; el QR se monta en
 * cuanto React hidrata con el origen real.
 */
const subscribeToOrigin = () => () => undefined;
const getOriginSnapshot = () => window.location.origin;
const getServerOriginSnapshot = () => "";

export default function ChildCredentialPage() {
  const params = useParams<{ id: string }>();
  const childId = Number(params.id);

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // El QR debe apuntar al dominio real del frontend, no al del backend.
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getOriginSnapshot,
    getServerOriginSnapshot,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await getChild(childId);
        if (cancelled) return;
        setChild(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [childId]);

  // El QR debe apuntar al dominio real del frontend, no al del backend, así que
  // se resuelve en el cliente tras el montaje para no tener un href inválido
  // durante el render del servidor.
  const publicUrl = useMemo(
    () => (origin && child ? `${origin}/publico/nino/${child.credentialCode}` : ""),
    [origin, child],
  );

  const primaryTutor = child?.tutors.find((tutor) => tutor.isPrimary) ?? null;
  const legacyCarnet = isLegacyCarnet(child?.carnet);

  if (error) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/children/${childId}`}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (loading || !child) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de acciones: se oculta al imprimir (ver .credential-print-area). */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/children/${child.id}`}>
              <ArrowLeft className="size-4" />
              Volver
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Credencial</h2>
            <p className="text-muted-foreground">
              Imprime esta tarjeta o guárdala como PDF.
            </p>
          </div>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {legacyCarnet && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 print:hidden">
          <p className="font-medium">Carnet provisional</p>
          <p className="mt-1">
            Este niño todavía usa el carnet generado por la migración (
            <code className="font-mono">{child.carnet}</code>). Reemplázalo por el
            documento real antes de entregar la credencial a la familia.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={`/children/${child.id}/edit`}>Editar carnet</Link>
          </Button>
        </div>
      )}

      <Card className="credential-print-area">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {child.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={child.photoUrl}
              alt={`Foto de ${child.name} ${child.lastName}`}
              className="size-28 shrink-0 rounded-lg border object-cover"
            />
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              PsicoTea
            </p>
            <h3 className="truncate text-xl font-bold tracking-tight">
              {child.name} {child.lastName}
            </h3>
            <p className="text-sm">
              <span className="text-muted-foreground">Carnet:</span>{" "}
              <span className="font-mono">{child.carnet}</span>
            </p>
            {primaryTutor ? (
              <div className="pt-1 text-sm">
                <p className="text-muted-foreground">Tutor principal</p>
                <p>
                  {primaryTutor.name} {primaryTutor.lastName}
                  <span className="text-muted-foreground">
                    {" "}
                    · {primaryTutor.relationship}
                  </span>
                </p>
                <p className="text-muted-foreground">{primaryTutor.phone}</p>
              </div>
            ) : (
              <p className="pt-1 text-sm text-muted-foreground">
                Sin tutor principal asignado.
              </p>
            )}
          </div>

          {publicUrl && (
            <div className="flex shrink-0 flex-col items-center gap-1">
              <CredentialQr value={publicUrl} />
              <p className="max-w-[10rem] text-center text-[10px] leading-tight text-muted-foreground">
                Escanea para ver los datos y el historial de informes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
