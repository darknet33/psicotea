## Why

El modelo `Staff` existe en `prisma/schema.prisma` desde el `init`, pero **no
tiene módulo, endpoints ni página**: no hay forma de registrar ni consultar al
personal administrativo del centro. El proyecto (§11 "Gestión de Recursos
Humanos" y §27 "MVP") pide explícitamente registro del personal, cargos,
fechas de ingreso, estado y control de acceso, y el sidebar ya muestra una
entrada `/staff` que hoy devuelve 404.

## What Changes

- **CRUD de `Staff`** (`GET/POST/PATCH /staff`) sobre el modelo ya existente,
  asociado a un `User` (rol `PERSONAL_ADMINISTRATIVO` o `ADMIN`).
- **Campos gestionados**: `employeeId` (único), `position`, `department`,
  `hireDate`, `salary`, `phone`, `address` e `isActive`.
- **Página `/staff`** con listado, alta/edición en diálogo y activar/desactivar.
- **RBAC**: solo `ADMIN` puede gestionar personal (coherente con §14.1).

Fuera de alcance de esta ronda (no modelado en el esquema): catálogos
separados de "cargos" y "especialidades"; `position`/`department` se manejan
como texto libre. No requiere migración (las tablas ya existen).

## Impact

- **Specs**: capability nueva `staff`.
- **Backend**: `backend/src/staff/` (controller, service, DTOs, module) y
  registro en `app.module.ts`.
- **Frontend**: `app/(dashboard)/staff/page.tsx`,
  `components/forms/staff-form.tsx`, `lib/api/staff.ts`, `types/staff.ts`.
- **Sin cambios de base de datos.**
