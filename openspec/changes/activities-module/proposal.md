## Why

El modelo `Activity` existe en `prisma/schema.prisma` desde el `init`, pero **no
tiene módulo, endpoints ni página**. El proyecto (§8 "Actividades diarias" y §27
"MVP") pide registrar las actividades de la jornada (responsable, niño, fecha,
detalle) y consultarlas después como parte del historial del niño. Hoy no existe
forma de hacerlo.

## What Changes

- **CRUD de actividades** (`GET/POST/PATCH /activities`) sobre `Activity`, con
  `childId`, `date`, `title`, `description` y `duration` (minutos).
- **Responsable**: el especialista que registra (`specialistId`) se toma del
  usuario autenticado cuando el rol es `ESPECIALISTA`; el `ADMIN` puede elegirlo.
- **Filtros**: por niño, responsable, rango de fechas y texto.
- **Historial del niño**: `GET /activities?childId=` para el expediente.
- **Página `/activities`** con listado, filtros y alta/edición.

El esquema actual no modela "tipo de actividad", "observaciones" ni "resultados"
(§8); esta ronda usa `title`/`description`. No requiere migración.

## Impact

- **Specs**: capability nueva `activities`.
- **Backend**: `backend/src/activities/` y registro en `app.module.ts`.
- **Frontend**: `app/(dashboard)/activities/page.tsx`,
  `components/forms/activity-form.tsx`, `lib/api/activities.ts`,
  `types/activity.ts`.
- **Sin cambios de base de datos.**
