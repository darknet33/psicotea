## 1. Backend

- [x] 1.1 Crear `backend/src/activities/activities.module.ts` y registrarlo en
      `app.module.ts`.
- [x] 1.2 DTOs: `create-activity.dto.ts`, `update-activity.dto.ts`,
      `query-activities.dto.ts`.
- [x] 1.3 `ActivitiesService`: listado con filtros (`childId`, `specialistId`,
      `from`, `to`, `search`), detalle, alta, edición y borrado.
- [x] 1.4 `ActivitiesController` con `JwtAuthGuard` + `RolesGuard`
      (`ADMIN`, `ESPECIALISTA`, `PERSONAL_ADMINISTRATIVO`); el especialista
      registra siempre a su propio nombre.
- [x] 1.5 Emitir eventos en tiempo real al crear/editar (cuando el módulo de
      realtime esté disponible).

## 2. Frontend

- [x] 2.1 `types/activity.ts`.
- [x] 2.2 `lib/api/activities.ts`.
- [x] 2.3 `components/forms/activity-form.tsx`.
- [x] 2.4 `app/(dashboard)/activities/page.tsx` con filtros por niño, fecha y
      responsable.

## 3. Verificación

- [x] 3.1 `backend`: `npm run build`, `npm run lint`, `npm test`.
- [x] 3.2 `fronted`: `npm run lint`, `npm run build`.
- [x] 3.3 `openspec validate --changes --strict`.
