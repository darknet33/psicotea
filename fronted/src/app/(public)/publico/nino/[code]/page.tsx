import { Metadata } from "next";
import { connection } from "next/server";
import {
  getPublicChild,
  isCredentialNotFound,
  publicSummaryPdfUrl,
} from "@/lib/api/public-child";
import { resolveMediaUrl } from "@/lib/axios";
import { formatDate, formatPrice } from "@/lib/format";
import type {
  PublicAttendanceStatus,
  PublicReportPeriod,
  PublicReportType,
} from "@/types/public-child";

export const metadata: Metadata = {
  title: "Credencial del niño",
  description:
    "Consulta el historial, las asistencias y los informes de tu niño en el centro PsicoTea.",
  // Esta página no debe indexarse: la URL contiene el token de la credencial.
  robots: { index: false, follow: false },
};

const REPORT_TYPE_LABELS: Record<PublicReportType, string> = {
  EVALUACION: "Evaluación",
  EVOLUTIVO: "Evolutivo",
  PERIODICO: "Periódico",
};

const REPORT_PERIOD_LABELS: Record<PublicReportPeriod, string> = {
  INICIO: "Principios de año",
  MEDIADOS: "Mediados de año",
  FIN: "Finales de año",
  NINGUNO: "",
};

const ATTENDANCE_LABELS: Record<PublicAttendanceStatus, string> = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  JUSTIFICADO: "Justificado",
};

const ATTENDANCE_COLORS: Record<PublicAttendanceStatus, string> = {
  PRESENTE: "text-success",
  AUSENTE: "text-error",
  JUSTIFICADO: "text-warning",
};

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  RETIRADO: "Retirado",
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

  const {
    name,
    lastName,
    carnet,
    age,
    photoUrl,
    diagnostico,
    primaryTutor,
    enrollments,
    attendances,
    activities,
    reports,
  } = profile;

  const presentCount = attendances.filter(
    (attendance) => attendance.status === "PRESENTE",
  ).length;

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
            src={resolveMediaUrl(photoUrl)}
            alt={`Foto de ${name} ${lastName}`}
            className="mx-auto mt-4 size-32 rounded-lg border object-cover"
          />
        )}
        <div className="mt-4">
          <a
            href={publicSummaryPdfUrl(code)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-dark"
          >
            Descargar resumen en PDF
          </a>
        </div>
      </header>

      {diagnostico && (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Diagnóstico</h2>
          <p className="mt-2 whitespace-pre-line text-sm">{diagnostico}</p>
        </section>
      )}

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
        <h2 className="text-base font-semibold">Inscripciones</h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay inscripciones registradas.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {enrollments.map((enrollment) => (
              <li key={enrollment.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {enrollment.type ?? "Inscripción"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(enrollment.startDate)} →{" "}
                    {enrollment.endDate ? formatDate(enrollment.endDate) : "sin fin"}
                  </p>
                </div>
                {enrollment.areas.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Áreas: {enrollment.areas.join(", ")}
                  </p>
                )}
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">Total:</dt>
                    <dd>{formatPrice(enrollment.amount)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">Pagado:</dt>
                    <dd>{formatPrice(enrollment.totalPaid)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">Saldo:</dt>
                    <dd
                      className={enrollment.balance > 0 ? "font-semibold text-error" : ""}
                    >
                      {formatPrice(enrollment.balance)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Asistencias</h2>
          {attendances.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {presentCount} de {attendances.length} presentes
            </p>
          )}
        </div>
        {attendances.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay registros de asistencia.
          </p>
        ) : (
          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {attendances.map((attendance) => (
              <li
                key={attendance.date}
                className="flex items-center justify-between border-b py-1.5 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">
                  {formatDate(attendance.date)}
                </span>
                <span
                  className={`font-medium ${ATTENDANCE_COLORS[attendance.status] ?? ""}`}
                >
                  {ATTENDANCE_LABELS[attendance.status] ?? attendance.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activities.length > 0 && (
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">Actividades</h2>
          <ul className="mt-3 space-y-2">
            {activities.map((activity, index) => (
              <li key={`${activity.date}-${index}`} className="text-sm">
                <p className="font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.date)}
                </p>
                {activity.description && (
                  <p className="mt-0.5 text-sm">{activity.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Informes</h2>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Todavía no hay informes publicados.
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {reports.map((report) => (
              <li key={report.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {REPORT_TYPE_LABELS[report.type] ?? report.type}
                    {report.reportPeriod !== "NINGUNO"
                      ? ` · ${REPORT_PERIOD_LABELS[report.reportPeriod]}`
                      : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(report.periodStart)} → {formatDate(report.periodEnd)}
                </p>
                {report.summary && (
                  <p className="mt-2 text-sm font-medium">{report.summary}</p>
                )}
                <p className="mt-2 whitespace-pre-line text-sm">{report.content}</p>
                {report.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Documentos:
                    </p>
                    <ul className="space-y-0.5">
                      {report.attachments.map((attachment, index) => (
                        <li key={`${attachment.fileUrl}-${index}`}>
                          <a
                            href={resolveMediaUrl(attachment.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline"
                          >
                            {attachment.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Si detectas algún dato incorrecto, comunícate con el centro PsicoTea.
      </p>
    </div>
  );
}
