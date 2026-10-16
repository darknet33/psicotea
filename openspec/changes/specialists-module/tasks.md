## 1. Modelo de datos

- [x] 1.1 Agregar enums `SpecialistShift` (`MANANA`, `TARDE`, `AMBOS`) a `prisma/schema.prisma`
- [x] 1.2 Agregar `entryDate DateTime` y `monthlySalary Decimal? @db.Decimal(10, 2)` a `model Specialist`
- [x] 1.3 Agregar `model SpecialistSchedule` con `@@unique([specialistId, dayOfWeek])`
- [x] 1.4 Agregar `model SpecialistArea` con `@@id([specialistId, areaId])`
- [x] 1.5 Agregar `model SpecialistPayment`
- [x] 1.6 Agregar las relaciones inversas en `Specialist` y `Area`
- [x] 1.7 Generar la migración y ejecutar `npx prisma generate` (migración `20261015120000_specialists_planning_reports`)

## 2. Módulo especialistas (backend)

- [x] 2.1 DTOs: `create-specialist.dto.ts`, `update-specialist.dto.ts`, `query-specialists.dto.ts`
- [x] 2.2 DTOs de horario: `specialist-schedule-day.dto.ts`
- [x] 2.3 DTO `update-specialist-areas.dto.ts`
- [x] 2.4 DTO `update-specialist-children.dto.ts`
- [x] 2.5 DTOs de pago: `create-specialist-payment.dto.ts`
- [x] 2.6 `specialists.service.ts` con CRUD, horario, áreas, niños y pagos
- [x] 2.7 `specialists.controller.ts` con guardas y `@Roles`
- [x] 2.8 `specialists.module.ts` y registro en `app.module.ts`
- [x] 2.9 `specialists.service.spec.ts` cubriendo duplicados, 404, horario, pagos

## 3. Frontend

- [x] 3.1 `src/types/specialist.ts`
- [x] 3.2 `src/lib/api/specialists.ts`
- [x] 3.3 `src/components/forms/specialist-form.tsx`
- [x] 3.4 `src/app/(dashboard)/specialists/page.tsx` con listado y detalle
- [x] 3.5 Editor de horarios, selector de áreas, asignación de niños y pestaña de pagos

## 4. Verificación

- [x] 4.1 `cd backend && npm run lint && npm run build`
- [x] 4.2 `cd fronted && npm run lint && npm run build`
- [x] 4.3 `openspec validate specialists-module --type change --strict`
