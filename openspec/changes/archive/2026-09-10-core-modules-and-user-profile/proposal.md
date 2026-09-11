## Why

El sistema tiene la base de auth/usuarios y el layout del frontend listos, pero carece de los módulos core de negocio (niños, inscripciones, pagos) en el backend y del perfil de usuario en la UI. Para operar el consultorio se necesita poder gestionar niños con sus tutores (no como usuarios, según `user-roles`), inscribirlos y cobrar las mensualidades; y que cada usuario pueda ver y editar su propia información y cambiar su contraseña (el endpoint `PATCH /auth/password` ya existe pero no tiene UI).

## What Changes

- **Backend — Módulo Children (nuevo)**: CRUD de niños con datos embebidos del tutor en el registro del niño, búsqueda, filtros por estado, asignación a especialista y expediente básico.
- **Backend — Modelo Prisma Child (BREAKING)**: el modelo `Child` actual referencia `parentId → User` mediante la relación `ParentChildren`. Según `user-roles` (Parents Are Not System Users), los tutores NO son usuarios: se reemplaza la relación por campos embebidos de tutor (`parentName`, `parentLastName`, `parentPhone`, `parentEmail`, `parentCarnet`, parentesco). Incluye migración y actualización de seed.
- **Backend — Módulo Enrollments (nuevo)**: inscripciones por niño con ciclo de vida `ACTIVO / INACTIVO / RETIRADO`, matrícula mensual y notas.
- **Backend — Módulo Payments (nuevo)**: registro de pagos (métodos EFECTIVO/TRANSFERENCIA/TARJETA/CHEQUE), pagos pendientes por periodo, historial por niño y por periodo.
- **Backend — Endpoint `PATCH /auth/me` (nuevo)**: el usuario autenticado actualiza su propio `name`, `lastName` y `email` (reutiliza `PATCH /auth/password` para contraseña; sin tocar rol, isActive).
- **Frontend — Perfil de usuario (nuevo)**: página `/profile` con datos propios editables y formulario de cambio de contraseña; se habilita la opción "Mi perfil" del `UserMenu` (hoy placeholder). Ruta protegida por `ProtectedRoute`.
- **Frontend — Tipos/API (nuevo)**: tipos `Child`, `Enrollment`, `Payment` y función de perfil en el store (`updateProfile`, `changePassword`).
- **Cierre de Fase 3 (bookkeeping)**: marcar como completas las tareas 3.1–3.14 del change `architecture-stack-definition` (ya implementadas en sesiones anteriores).

## Capabilities

### New Capabilities

- `children`: gestión de niños con datos del tutor embebidos, expediente, búsqueda/filtros, asignación a especialista y permisos por rol.
- `enrollments`: inscripciones con ciclo de vida de estado, matrícula mensual y notas.
- `payments`: registro y consulta de pagos, métodos, pagos pendientes e historial por periodo/nino.
- `user-profile`: consulta y edición de datos propios del usuario autenticado y cambio de contraseña.

### Modified Capabilities

- Ninguna: no cambian requisitos de specs existentes. El alta de niños/tutores respeta `user-roles`, y el perfil reutiliza `auth-system` sin modificar sus requisitos.

## Impact

- `backend/prisma/schema.prisma` (modelo `Child`, se elimina `parentId`/relación `ParentChildren`) + migración + `seed.ts`.
- `backend/src/app.module.ts`: registro de `ChildrenModule`, `EnrollmentsModule`, `PaymentsModule`.
- Nuevos módulos NestJS: `children/`, `enrollments/`, `payments/` (controller, service, module, dto) en `backend/src/`.
- `backend/src/auth/auth.controller.ts` + `auth.service.ts`: `PATCH /auth/me`.
- Frontend: nueva página `fronted/src/app/(dashboard)/profile/page.tsx`, actualización de `fronted/src/components/layout/user-menu.tsx`, `fronted/src/stores/auth-store.ts`, tipos en `fronted/src/types/`.
- Dependencias: ninguna nueva (Prisma + Nest + UI/forms ya instalados).