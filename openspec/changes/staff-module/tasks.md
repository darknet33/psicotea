## 1. Backend

- [x] 1.1 Crear `backend/src/staff/staff.module.ts` y registrarlo en `app.module.ts`.
- [x] 1.2 DTOs: `create-staff.dto.ts`, `update-staff.dto.ts`, `query-staff.dto.ts`
      (con `@Type(() => Number)` donde aplique).
- [x] 1.3 `StaffService`: listado (activos por defecto / `includeInactive`),
      detalle, alta (valida `userId` y `employeeId` únicos, evita duplicar
      `Staff` del mismo usuario), edición y activar/desactivar.
- [x] 1.4 `StaffController` con `JwtAuthGuard` + `RolesGuard` (solo `ADMIN`).
- [x] 1.5 Convertir `Decimal` de `salary` a número en la respuesta.

## 2. Frontend

- [x] 2.1 `types/staff.ts` (`Staff`, `StaffInput`).
- [x] 2.2 `lib/api/staff.ts` (`listStaff`, `createStaff`, `updateStaff`).
- [x] 2.3 `components/forms/staff-form.tsx` (selector de usuario + datos
      laborales, patrón wrapper + body).
- [x] 2.4 `app/(dashboard)/staff/page.tsx` con tabla, búsqueda y acciones.

## 3. Verificación

- [x] 3.1 `backend`: `npm run build`, `npm run lint`, `npm test`.
- [x] 3.2 `fronted`: `npm run lint`, `npm run build`.
- [x] 3.3 `openspec validate --changes --strict`.
