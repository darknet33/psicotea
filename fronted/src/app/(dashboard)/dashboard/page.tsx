"use client";

import { useEffect, useState } from "react";
import { Users, ClipboardList, CreditCard, CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listChildren } from "@/lib/api/children";
import { listEnrollments } from "@/lib/api/enrollments";
import { listPayments } from "@/lib/api/payments";
import { getCurrentMonthRange, formatPrice } from "@/lib/format";
import { useAuthStore } from "@/stores/auth-store";

interface StatCardData {
  label: string;
  value: string | null;
  error: boolean;
  icon: typeof Users;
  description: string;
  loadingDescription: string;
}

export default function DashboardPage() {
  const role = useAuthStore((state) => state.user?.role);

  const [stats, setStats] = useState<StatCardData[]>([
    {
      label: "Niños activos",
      value: null,
      error: false,
      icon: Users,
      description: "Pacientes con ficha activa",
      loadingDescription: "Calculando...",
    },
    {
      label: "Inscripciones del mes",
      value: null,
      error: false,
      icon: ClipboardList,
      description: "Altas en el mes actual",
      loadingDescription: "Calculando...",
    },
    {
      label: "Pagos del mes",
      value: null,
      error: false,
      icon: CreditCard,
      description: "Acumulado del mes actual",
      loadingDescription: "Calculando...",
    },
    {
      label: "Asistencias de hoy",
      value: "—",
      error: false,
      icon: CalendarCheck,
      description: "Disponible con el módulo de asistencias",
      loadingDescription: "—",
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { start, end } = getCurrentMonthRange();

      const [children, enrollments, payments] = await Promise.all([
        listChildren({ isActive: true }).catch(() => null),
        listEnrollments({ status: "ACTIVO" }).catch(() => null),
        listPayments({ periodStart: start, periodEnd: end }).catch(() => null),
      ]);

      if (cancelled) return;

      const monthPrefix = start.slice(0, 7);
      const monthEnrollments = enrollments
        ? enrollments.filter((enrollment) => enrollment.startDate.slice(0, 7) === monthPrefix)
        : null;
      const monthTotal = payments ? payments.reduce((sum, payment) => sum + payment.amount, 0) : null;

      setStats((prev) =>
        prev.map((stat) => {
          if (stat.label === "Niños activos") {
            return children
              ? { ...stat, value: String(children.length), error: false }
              : { ...stat, value: null, error: true };
          }
          if (stat.label === "Inscripciones del mes") {
            return monthEnrollments
              ? { ...stat, value: String(monthEnrollments.length), error: false }
              : { ...stat, value: null, error: true };
          }
          if (stat.label === "Pagos del mes") {
            return monthTotal !== null
              ? { ...stat, value: formatPrice(monthTotal), error: false }
              : { ...stat, value: null, error: true };
          }
          return stat;
        }),
      );
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general de la actividad de PsicoTea.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.value !== null ? (
                <div className="text-2xl font-bold">{stat.value}</div>
              ) : stat.error ? (
                <div className="text-sm font-medium text-error">Sin conexión</div>
              ) : (
                <Skeleton className="h-7 w-24" />
              )}
              <p className="text-xs text-muted-foreground">
                {stat.error && stat.value === null ? "No se pudo cargar el dato" : stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Actividad reciente
          </CardTitle>
          <CardDescription>
            {role === "ESPECIALISTA"
              ? "Resumen de tus pacientes y su seguimiento."
              : "Aquí aparecerán las últimas operaciones del sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay actividad reciente para mostrar todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}