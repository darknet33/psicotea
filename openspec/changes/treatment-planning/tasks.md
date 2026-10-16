## 1. Modelo de datos

- [x] 1.1 Agregar enum `PlanFrequency` (`DAILY`, `WEEKLY`)
- [x] 1.2 Agregar `model TreatmentPlan`
- [x] 1.3 Agregar `model TreatmentPlanItem`
- [x] 1.4 Agregar `model EvolutionNote`
- [x] 1.5 Relaciones en `Child`, `User` y `Area`
- [x] 1.6 Migración `20261015120000_specialists_planning_reports` y `prisma generate`

## 2. Backend

- [x] 2.1 DTOs de plan, ítem y nota de evolución
- [x] 2.2 `planning.service.ts` con planes, ítems, agenda y notas
- [x] 2.3 `planning.controller.ts` con alcance por especialista
- [x] 2.4 `planning.module.ts` + registro en `app.module.ts`
- [x] 2.5 `planning.service.spec.ts`

## 3. Frontend

- [x] 3.1 `src/types/planning.ts`
- [x] 3.2 `src/lib/api/planning.ts`
- [x] 3.3 `src/app/(dashboard)/planning/page.tsx` (pestañas de planes, agenda y evolución)
- [x] 3.4 Formulario de plan e ítems (`plan-form.tsx`, `plan-items-dialog.tsx`)
- [x] 3.5 Diálogo de nota de evolución (`evolution-note-form.tsx`)
- [x] 3.6 Entrada en el sidebar

## 4. Verificación

- [x] 4.1 `cd backend && npm run lint && npm run build`
- [x] 4.2 `cd fronted && npm run lint && npm run build`
- [x] 4.3 `openspec validate treatment-planning --type change --strict`
