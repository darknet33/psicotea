import { api } from "@/lib/axios";
import type {
  EvolutionDraft,
  QueryReports,
  Report,
  ReportAttachment,
  ReportInput,
} from "@/types/report";

export async function listReports(query: QueryReports = {}): Promise<Report[]> {
  const { data } = await api.get<Report[]>("/reports", { params: query });
  return data;
}

export async function getReport(id: number): Promise<Report> {
  const { data } = await api.get<Report>(`/reports/${id}`);
  return data;
}

export async function createReport(input: ReportInput): Promise<Report> {
  const { data } = await api.post<Report>("/reports", input);
  return data;
}

export async function updateReport(
  id: number,
  input: Partial<ReportInput> & { isDraft?: boolean; visibilityToParents?: boolean },
): Promise<Report> {
  const { data } = await api.patch<Report>(`/reports/${id}`, input);
  return data;
}

export async function removeReport(id: number): Promise<void> {
  await api.delete(`/reports/${id}`);
}

/**
 * Prellena un informe evolutivo con las notas de evolución del niño en el
 * rango indicado. Devuelve el texto consolidado y cuántas notas se usaron.
 */
export async function getEvolutionDraft(params: {
  childId: number;
  from?: string;
  to?: string;
}): Promise<EvolutionDraft> {
  const { data } = await api.get<EvolutionDraft>("/reports/evolution-draft", {
    params,
  });
  return data;
}

export async function listAttachments(reportId: number): Promise<ReportAttachment[]> {
  const { data } = await api.get<ReportAttachment[]>(
    `/reports/${reportId}/attachments`,
  );
  return data;
}

export async function addAttachment(
  reportId: number,
  input: { name: string; fileUrl: string; mimeType?: string },
): Promise<ReportAttachment> {
  const { data } = await api.post<ReportAttachment>(
    `/reports/${reportId}/attachments`,
    input,
  );
  return data;
}

export async function deleteAttachment(
  reportId: number,
  attachmentId: number,
): Promise<void> {
  await api.delete(`/reports/${reportId}/attachments/${attachmentId}`);
}

/**
 * Descarga el PDF del informe.
 *
 * El endpoint requiere JWT, así que no se puede usar un `<a href>`: se pide el
 * archivo como blob y se dispara la descarga desde el navegador.
 */
export async function downloadReportPdf(report: Report): Promise<void> {
  const response = await api.get(`/reports/${report.id}/pdf`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `informe-${report.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
