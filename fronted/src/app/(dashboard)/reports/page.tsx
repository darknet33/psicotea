"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { ChildSelect } from "@/components/forms/child-select";
import { SpecialistSelect } from "@/components/forms/specialist-select";
import { ReportForm } from "@/components/forms/report-form";
import { downloadReportPdf, listReports, removeReport } from "@/lib/api/reports";
import { getErrorMessage } from "@/lib/axios";
import { formatDate } from "@/lib/format";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  type Report,
  type ReportType,
} from "@/types/report";
import { useAuthStore } from "@/stores/auth-store";

const inputClass =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function ReportsPage() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [childFilter, setChildFilter] = useState<number | null>(null);
  const [specialistFilter, setSpecialistFilter] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<ReportType | "">("");
  const [includeDrafts, setIncludeDrafts] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setReports(
        await listReports({
          childId: childFilter ?? undefined,
          specialistId: isAdmin ? (specialistFilter ?? undefined) : undefined,
          type: typeFilter || undefined,
          includeDrafts,
        }),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [childFilter, specialistFilter, typeFilter, includeDrafts, isAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchReports();
    }, 200);
    return () => clearTimeout(timeout);
  }, [fetchReports]);

  async function handleDownload(report: Report) {
    try {
      setDownloadingId(report.id);
      await downloadReportPdf(report);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleRemove(report: Report) {
    try {
      await removeReport(report.id);
      toast.success("Informe eliminado");
      void fetchReports();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns: DataTableColumn<Report>[] = [
    {
      key: "title",
      header: "Informe",
      cell: (report) => (
        <div className="space-y-0.5">
          <p className="font-medium">{report.title}</p>
          <p className="text-xs text-muted-foreground">
            {report.child.name} {report.child.lastName}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (report) => (
        <div className="space-y-1">
          <span>{REPORT_TYPE_LABELS[report.type]}</span>
          {report.type === "PERIODICO" && report.reportPeriod !== "NINGUNO" && (
            <p className="text-xs text-muted-foreground">{report.reportPeriod}</p>
          )}
        </div>
      ),
    },
    {
      key: "period",
      header: "Período",
      cell: (report) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
        </span>
      ),
    },
    {
      key: "specialist",
      header: "Autor",
      cell: (report) => `${report.specialist.name} ${report.specialist.lastName}`,
    },
    {
      key: "status",
      header: "Estado",
      cell: (report) => (
        <div className="flex flex-wrap gap-1">
          {report.isDraft ? (
            <Badge variant="warning">Borrador</Badge>
          ) : (
            <Badge variant="success">Final</Badge>
          )}
          {report.visibilityToParents && <Badge variant="secondary">Visible</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (report) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={downloadingId === report.id}
            onClick={() => void handleDownload(report)}
          >
            <Download className="size-4" />
            PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(report);
              setFormOpen(true);
            }}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handleRemove(report)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RoleBasedRoute allowedRoles={["ADMIN", "ESPECIALISTA"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Informes</h2>
            <p className="text-muted-foreground">
              Informes de evaluación, evolutivos y periódicos, con exportación a PDF.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Nuevo informe
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:max-w-xs">
            <ChildSelect
              value={childFilter ?? 0}
              onChange={(value) => setChildFilter(value || null)}
              allowEmpty
              label="Filtrar por niño"
            />
          </div>
          {isAdmin && (
            <div className="w-full sm:max-w-xs">
              <SpecialistSelect
                value={specialistFilter}
                onChange={setSpecialistFilter}
                allowEmpty
                label="Filtrar por autor"
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="type-filter" className="text-sm font-medium">
              Tipo
            </label>
            <select
              id="type-filter"
              className={inputClass}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as ReportType | "")}
            >
              <option value="">Todos</option>
              {REPORT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {REPORT_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            onClick={() => setIncludeDrafts((value) => !value)}
          >
            {includeDrafts ? "Ocultar borradores" : "Mostrar borradores"}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={reports}
          rowKey={(report) => report.id}
          loading={loading}
          error={error}
          onRetry={() => void fetchReports()}
          emptyMessage="No hay informes registrados"
        />
      </div>

      <ReportForm
        open={formOpen}
        onOpenChange={setFormOpen}
        report={editing}
        onSaved={() => void fetchReports()}
      />
    </RoleBasedRoute>
  );
}
