import { Metadata } from "next";
import { connection } from "next/server";
import { getPublicChild, isCredentialNotFound } from "@/lib/api/public-child";

export const metadata: Metadata = {
  title: "Credencial del niño",
  description:
    "Consulta los datos de contacto y los informes de tu niño en el centro PsicoTea.",
  // Esta página no debe indexarse: la URL contiene el token de la credencial.
  robots: { index: false, follow: false },
};

/**
 * Estado de credencial no reconocida. Se muestra dentro de la página en vez de
 * llamar a `notFound()` para poder explicar qué hacer, sin exponer un mensaje
 * técnico del backend.
 */
function InvalidCredential() {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">Credencial no válida</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El código que abriste no corresponde a ninguna credencial vigente. Puede
        que el niño esté inactivo o que el QR esté dañado.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Verifica con el centro que el niño esté activo y pide una credencial
        nueva.
      </p>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <h1 className="text-lg font-semibold">No pudimos consultar la credencial</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Inténtalo de nuevo en unos minutos.
      </p>
    </div>
  );
}

export default async function PublicChildPage({ params }: PageProps<"/publico/nino/[code]">) {
  // Los datos dependen del token de la URL: nada de esto puede prerenderizarse
  // ni cachearse, porque la respuesta contiene datos personales del niño.
  await connection();

  const { code } = await params;

  let profile;
  try {
    profile = await getPublicChild(code);
  } catch (error) {
    if (isCredentialNotFound(error)) {
      return <InvalidCredential />;
    }
    // Cualquier otro fallo (red, backend caído) se degrada a un mensaje
    // genérico: nunca se filtra un error técnico al padre.
    return <Unavailable />;
  }

  const { name, lastName, carnet, age, photoUrl, primaryTutor, reports } = profile;

  return (
    <div className="space-y-4">
      <header className="rounded-lg border bg-card p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          PsicoTea
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {name} {lastName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {age} {age === 1 ? "año" : "años"} · {carnet}
        </p>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={`Foto de ${name} ${lastName}`}
            className="mx-auto mt-4 size-32 rounded-lg border object-cover"
          />
        )}
      </header>

      {primaryTutor && (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Tutor principal</h2>
          <p className="mt-1 text-sm">
            {primaryTutor.name} {primaryTutor.lastName}
            <span className="text-muted-foreground"> · {primaryTutor.relationship}</span>
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Celular/WhatsApp:</dt>
              <dd>
                <a href={`tel:${primaryTutor.phone}`} className="underline">
                  {primaryTutor.phone}
                </a>
              </dd>
            </div>
            {primaryTutor.address && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Dirección:</dt>
                <dd>{primaryTutor.address}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Informes</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay informes publicados.
          </p>
        ) : (
          <ul className="mt-3 divide-y">
            {reports.map((report) => (
              <li key={`${report.title}-${report.periodStart}`} className="py-2 text-sm">
                <p className="font-medium">{report.title}</p>
                <p className="text-muted-foreground">
                  {report.periodStart} → {report.periodEnd}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Si necesitas el contenido de un informe, solicítalo en recepción.
      </p>
    </div>
  );
}
