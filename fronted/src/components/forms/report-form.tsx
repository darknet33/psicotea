"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Paperclip, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateSelects } from "@/components/forms/date-selects";
import { ChildSelect } from "@/components/forms/child-select";
import { SpecialistSelect } from "@/components/forms/specialist-select";
import {
  addAttachment,
  createReport,
  deleteAttachment,
  getEvolutionDraft,
  updateReport,
} from "@/lib/api/reports";
import { uploadDocument } from "@/lib/api/uploads";
import { getErrorMessage } from "@/lib/axios";
import { formatDate, toDateInputValue, todayInputValue } from "@/lib/format";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  type Report,
  type ReportAttachment,
  type ReportPeriod,
  type ReportType,
} from "@/types/report";
import { useAuthStore } from "@/stores/auth-store";

const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const textareaClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const reportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(200, "El título no puede superar los 200 caracteres"),
  content: z
    .string()
    .trim()
    .min(1, "El contenido del informe es obligatorio")
    .max(20000, "El contenido no puede superar los 20000 caracteres"),
  summary: z.string().max(2000, "El resumen no puede superar los 2000 caracteres"),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: Report | null;
  onSaved: () => void;
}

interface ReportFormBodyProps {
  report?: Report | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ReportForm({ open, onOpenChange, report, onSaved }: ReportFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {open && (
          <ReportFormBody
            key={report?.id ?? "new"}
            report={report}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReportFormBody({ report, onOpenChange, onSaved }: ReportFormBodyProps) {
  const isEdit = Boolean(report);
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const [childId, setChildId] = useState<number | null>(report?.childId ?? null);
  const [specialistId, setSpecialistId] = useState<number | null>(
    report?.specialistId ?? null,
  );
  const [type, setType] = useState<ReportType>(report?.type ?? "EVALUACION");
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>(
    report?.reportPeriod ?? "NINGUNO",
  );
  const [periodStart, setPeriodStart] = useState(
    report?.periodStart ? toDateInputValue(report.periodStart) : todayInputValue(),
  );
  const [periodEnd, setPeriodEnd] = useState(
    report?.periodEnd ? toDateInputValue(report.periodEnd) : todayInputValue(),
  );
  const [isDraft, setIsDraft] = useState(report?.isDraft ?? false);
  const [visibilityToParents, setVisibilityToParents] = useState(
    report?.visibilityToParents ?? false,
  );
  const [attachments, setAttachments] = useState<ReportAttachment[]>(
    report?.attachments ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: report?.title ?? "",
      content: report?.content ?? "",
      summary: report?.summary ?? "",
    },
  });

  async function handlePrefillDraft() {
    if (!childId) {
      setFormError("Selecciona un niño antes de prellenar");
      return;
    }
    try {
      setDraftLoading(true);
      const draft = await getEvolutionDraft({
        childId,
        from: periodStart || undefined,
        to: periodEnd || undefined,
      });
      if (!draft.content) {
        toast.info("No hay notas de evolución en el período indicado");
        return;
      }
      setValue("content", draft.content);
      toast.success(`Se consolidaron ${draft.count} notas de evolución`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDraftLoading(false);
    }
  }

  async function handleUpload(file: File) {
    if (!report) return;
    try {
      setUploading(true);
      const uploaded = await uploadDocument(file);
      const attachment = await addAttachment(report.id, {
        name: file.name,
        fileUrl: uploaded.url,
        mimeType: uploaded.mimeType,
      });
      setAttachments((current) => [...current, attachment]);
      toast.success("Documento adjuntado");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAttachment(attachment: ReportAttachment) {
    if (!report) return;
    try {
      await deleteAttachment(report.id, attachment.id);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      toast.success("Documento eliminado");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function handleFormSubmit(values: ReportFormValues) {
    setFormError(null);

    if (!isEdit && !childId) {
      setFormError("Selecciona un niño");
      return;
    }
    if (!isEdit && isAdmin && !specialistId) {
      setFormError("Selecciona el especialista responsable");
      return;
    }
    if (!periodStart || !periodEnd) {
      setFormError("Indica el período del informe");
      return;
    }
    if (periodStart > periodEnd) {
      setFormError("El fin del período debe ser posterior al inicio");
      return;
    }

    try {
      if (isEdit && report) {
        await updateReport(report.id, {
          title: values.title.trim(),
          content: values.content.trim(),
          type,
          reportPeriod,
          summary: values.summary.trim() || undefined,
          periodStart,
          periodEnd,
          isDraft,
          visibilityToParents,
        });
        toast.success("Informe actualizado");
      } else {
        await createReport({
          childId: childId as number,
          specialistId: specialistId ?? undefined,
          title: values.title.trim(),
          content: values.content.trim(),
          type,
          reportPeriod,
          summary: values.summary.trim() || undefined,
          periodStart,
          periodEnd,
          isDraft,
          visibilityToParents,
        });
        toast.success("Informe creado");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Editar informe" : "Nuevo informe"}</DialogTitle>
        <DialogDescription>
          Evaluación al ingreso, informe evolutivo (consolida notas de evolución) o
          informe periódico.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {!isEdit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChildSelect value={childId ?? 0} onChange={setChildId} />
            {isAdmin && (
              <SpecialistSelect value={specialistId} onChange={setSpecialistId} />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de informe</Label>
            <select
              id="type"
              className={inputClass}
              value={type}
              onChange={(event) => setType(event.target.value as ReportType)}
            >
              {REPORT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {REPORT_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reportPeriod">Momento del año</Label>
            <select
              id="reportPeriod"
              className={inputClass}
              value={reportPeriod}
              disabled={type !== "PERIODICO"}
              onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
            >
              {REPORT_PERIODS.map((value) => (
                <option key={value} value={value}>
                  {REPORT_PERIOD_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-error">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Inicio del período</Label>
            <DateSelects value={periodStart} onChange={setPeriodStart} />
          </div>
          <div className="space-y-2">
            <Label>Fin del período</Label>
            <DateSelects value={periodEnd} onChange={setPeriodEnd} />
          </div>
        </div>

        {type === "EVOLUTIVO" && (
          <div className="flex items-center gap-2 rounded-md border border-dashed p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrefillDraft}
              disabled={draftLoading || !childId}
            >
              <Sparkles className="size-4" />
              {draftLoading ? "Consolidando..." : "Prellenar con notas de evolución"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Arma el contenido a partir de las notas del período.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="content">Contenido</Label>
          <textarea id="content" rows={10} className={textareaClass} {...register("content")} />
          {errors.content && (
            <p className="text-sm text-error">{errors.content.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Resumen (opcional, visible a los padres)</Label>
          <textarea id="summary" rows={3} className={textareaClass} {...register("summary")} />
          {errors.summary && (
            <p className="text-sm text-error">{errors.summary.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={isDraft}
              onChange={(event) => setIsDraft(event.target.checked)}
            />
            Guardar como borrador
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={visibilityToParents}
              onChange={(event) => setVisibilityToParents(event.target.checked)}
            />
            Visible para los padres en el portal público
          </label>
        </div>

        {isEdit && report && (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Documentos adjuntos</p>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary">
                <Paperclip className="size-4" />
                {uploading ? "Subiendo..." : "Adjuntar documento"}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUpload(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin documentos adjuntos.</p>
            ) : (
              <ul className="space-y-1">
                {attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {attachment.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {formatDate(attachment.createdAt)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemoveAttachment(attachment)}
                      aria-label="Eliminar documento"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {formError && <p className="text-sm text-error">{formError}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEdit ? "Guardar" : "Crear informe"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
