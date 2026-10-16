"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { RoleBasedRoute } from "@/components/auth/role-based-route";
import { ChildSelect } from "@/components/forms/child-select";
import { SpecialistSelect } from "@/components/forms/specialist-select";
import { PlanForm } from "@/components/forms/plan-form";
import { PlanItemsDialog } from "@/components/forms/plan-items-dialog";
import { EvolutionNoteForm } from "@/components/forms/evolution-note-form";
import {
  deleteEvolution,
  getAgenda,
  listEvolution,
  listPlans,
  updatePlan,
} from "@/lib/api/planning";
import { getErrorMessage } from "@/lib/axios";
import { formatDate, todayInputValue } from "@/lib/format";
import type {
  AgendaEntry,
  EvolutionNote,
  TreatmentPlan,
} from "@/types/planning";
import { PLAN_FREQUENCY_LABELS } from "@/types/planning";
import { useAuthStore } from "@/stores/auth-store";

const inputClass =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type Tab = "plans" | "agenda" | "evolution";

export default function PlanningPage() {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "ADMIN";

  const [tab, setTab] = useState<Tab>("plans");
  const [childFilter, setChildFilter] = useState<number | null>(null);
  const [specialistFilter, setSpecialistFilter] = useState<number | null>(null);

  // --- Planes ---
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null);
  const [itemsPlan, setItemsPlan] = useState<TreatmentPlan | null>(null);

  // --- Agenda ---
  const [agendaDate, setAgendaDate] = useState(todayInputValue());
  const [agenda, setAgenda] = useState<AgendaEntry[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);

  // --- Evolución ---
  const [notes, setNotes] = useState<EvolutionNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EvolutionNote | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      setPlans(
        await listPlans({
          childId: childFilter ?? undefined,
          specialistId: isAdmin ? (specialistFilter ?? undefined) : undefined,
          includeInactive,
        }),
      );
    } catch (error) {
      setPlansError(getErrorMessage(error));
    } finally {
      setPlansLoading(false);
    }
  }, [childFilter, specialistFilter, includeInactive, isAdmin]);

  const fetchAgenda = useCallback(async () => {
    try {
      setAgendaLoading(true);
      setAgenda(
        await getAgenda({
          date: agendaDate,
          specialistId: isAdmin ? (specialistFilter ?? undefined) : undefined,
        }),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
      setAgenda([]);
    } finally {
      setAgendaLoading(false);
    }
  }, [agendaDate, specialistFilter, isAdmin]);

  const fetchNotes = useCallback(async () => {
    try {
      setNotesLoading(true);
      setNotes(
        await listEvolution({
          childId: childFilter ?? undefined,
          specialistId: isAdmin ? (specialistFilter ?? undefined) : undefined,
        }),
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [childFilter, specialistFilter, isAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchPlans(), 0);
    return () => clearTimeout(timeout);
  }, [fetchPlans]);

  useEffect(() => {
    if (tab !== "agenda") return;
    const timeout = setTimeout(() => void fetchAgenda(), 0);
    return () => clearTimeout(timeout);
  }, [tab, fetchAgenda]);

  useEffect(() => {
    if (tab !== "evolution") return;
    const timeout = setTimeout(() => void fetchNotes(), 0);
    return () => clearTimeout(timeout);
  }, [tab, fetchNotes]);

  async function togglePlanActive(plan: TreatmentPlan) {
    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      toast.success(plan.isActive ? "Plan desactivado" : "Plan reactivado");
      void fetchPlans();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function removeNote(note: EvolutionNote) {
    try {
      await deleteEvolution(note.id);
      toast.success("Nota eliminada");
      void fetchNotes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const planColumns: DataTableColumn<TreatmentPlan>[] = [
    {
      key: "child",
      header: "Niño",
      cell: (plan) => (
        <span className="font-medium">
          {plan.child.name} {plan.child.lastName}
        </span>
      ),
    },
    {
      key: "area",
      header: "Área",
      cell: (plan) => plan.area?.name ?? <span className="text-muted-foreground">General</span>,
    },
    {
      key: "specialist",
      header: "Especialista",
      cell: (plan) =>
        `${plan.specialist.user.name} ${plan.specialist.user.lastName}`,
    },
    {
      key: "frequency",
      header: "Frecuencia",
      cell: (plan) => PLAN_FREQUENCY_LABELS[plan.frequency],
    },
    {
      key: "period",
      header: "Período",
      cell: (plan) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(plan.startDate)} - {plan.endDate ? formatDate(plan.endDate) : "vigente"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Ítems",
      cell: (plan) => plan.items.length,
    },
    {
      key: "status",
      header: "Estado",
      cell: (plan) =>
        plan.isActive ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="destructive">Inactivo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (plan) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setItemsPlan(plan)}>
            Ítems
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingPlan(plan);
              setPlanFormOpen(true);
            }}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void togglePlanActive(plan)}>
            {plan.isActive ? "Desactivar" : "Reactivar"}
          </Button>
        </div>
      ),
    },
  ];

  const noteColumns: DataTableColumn<EvolutionNote>[] = [
    {
      key: "date",
      header: "Fecha",
      cell: (note) => formatDate(note.date),
    },
    {
      key: "child",
      header: "Niño",
      cell: (note) => `${note.child.name} ${note.child.lastName}`,
    },
    {
      key: "specialist",
      header: "Especialista",
      cell: (note) =>
        `${note.specialist.user.name} ${note.specialist.user.lastName}`,
    },
    {
      key: "content",
      header: "Contenido",
      cell: (note) => (
        <span className="line-clamp-2 max-w-md text-sm">{note.content}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (note) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingNote(note);
              setNoteFormOpen(true);
            }}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void removeNote(note)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "plans", label: "Planes" },
    { id: "agenda", label: "Agenda" },
    { id: "evolution", label: "Notas de evolución" },
  ];

  return (
    <RoleBasedRoute allowedRoles={["ADMIN", "ESPECIALISTA"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Planificación</h2>
          <p className="text-muted-foreground">
            Planes de tratamiento, agenda diaria y notas de evolución.
          </p>
        </div>

        <div className="flex gap-2 border-b">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
                label="Filtrar por especialista"
              />
            </div>
          )}
        </div>

        {tab === "plans" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setIncludeInactive((value) => !value)}
              >
                {includeInactive ? "Ocultar inactivos" : "Mostrar inactivos"}
              </Button>
              <Button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Nuevo plan
              </Button>
            </div>
            <DataTable
              columns={planColumns}
              data={plans}
              rowKey={(plan) => plan.id}
              loading={plansLoading}
              error={plansError}
              onRetry={() => void fetchPlans()}
              emptyMessage="No hay planes de tratamiento"
            />
          </div>
        )}

        {tab === "agenda" && (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <label htmlFor="agenda-date" className="text-sm font-medium">
                  Fecha
                </label>
                <input
                  id="agenda-date"
                  type="date"
                  className={inputClass}
                  value={agendaDate}
                  onChange={(event) => setAgendaDate(event.target.value)}
                />
              </div>
            </div>

            {agendaLoading ? (
              <p className="text-sm text-muted-foreground">Cargando agenda...</p>
            ) : agenda.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No hay actividades programadas para esta fecha.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {agenda.map((entry) => (
                  <div
                    key={`${entry.planId}-${entry.itemId}-${entry.date}`}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.childName}
                        {entry.areaName ? ` · ${entry.areaName}` : ""}
                      </p>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                      )}
                    </div>
                    {entry.completed ? (
                      <Badge variant="success">Registrada</Badge>
                    ) : (
                      <Badge variant="warning">Pendiente</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "evolution" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingNote(null);
                  setNoteFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Nueva nota
              </Button>
            </div>
            <DataTable
              columns={noteColumns}
              data={notes}
              rowKey={(note) => note.id}
              loading={notesLoading}
              emptyMessage="No hay notas de evolución"
            />
          </div>
        )}
      </div>

      <PlanForm
        open={planFormOpen}
        onOpenChange={setPlanFormOpen}
        plan={editingPlan}
        onSaved={() => void fetchPlans()}
      />
      <PlanItemsDialog
        plan={itemsPlan}
        open={Boolean(itemsPlan)}
        onOpenChange={(open) => !open && setItemsPlan(null)}
        onChanged={() => void fetchPlans()}
      />
      <EvolutionNoteForm
        open={noteFormOpen}
        onOpenChange={setNoteFormOpen}
        note={editingNote}
        onSaved={() => void fetchNotes()}
      />
    </RoleBasedRoute>
  );
}
