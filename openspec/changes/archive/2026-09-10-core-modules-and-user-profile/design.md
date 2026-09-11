## Context

- Backend NestJS 10 + Prisma 5 (MySQL) con auth JWT/RBAC listo (`JwtAuthGuard`, `RolesGuard`, `@Roles()`, `PrismaService`).
- El schema actual define `Child.parentId → User` (relacion `ParentChildren`), lo que contradice la spec `user-roles` (Parents Are Not System Users): los tutores no son usuarios de la plataforma.
- `Enrollment`, `Payment`, `Attendance`, `Activity`, `Report`, `Specialist`, `Staff`, `Expense` ya existen como modelos Prisma; no hay modulos NestJS de negocio creados aun.
- Frontend Next.js 16: shell `(dashboard)` + `ProtectedRoute` + `RoleBasedRoute` + UI kit (shadcn). `UserMenu` muestra "Mi perfil" como item placeholder que no navega.
- `PATCH /auth/password` ya existe en el backend (cambio de contrasena), sin UI.
- Los modulos Fase 4 abiertos: Children, Enrollments, Payments.

## Goals / Non-Goals

**Goals:**
- Corregir el modelo `Child` para embedir datos de tutor y romper la dependencia con `User`.
- Implementar en backend los modulos Children, Enrollments y Payments con endpoints protegidos por JWT + rol, DTOs validados y acceso a Prisma como unico punto de datos.
- Habilitar el perfil del usuario en frontend (ver/editar datos propios + cambio de contrasena), reutilizando `PATCH /auth/password` y agregando `PATCH /auth/me`.
- Mantener el patron de bloques y roles ya establecido (migracion de seed, guards, decoradores) para no introducir convenciones nuevas.

**Non-Goals:**
- Paginas de negocio en frontend (listados CRUD de nino/inscripciones/pagos) — corresponden a la Fase 5 (change `architecture-stack-definition`), fuera de este change.
- Modulos Attendance, Activities, Reports (Fase 6).
- Portal publico de padres con carnet (funcionalidad futura, `user-roles`).
- Exportacion/cobranza automatizada.

## Decisions

### D1. Modelo Child con datos de tutor embebidos (BREAKING)
Se elimina `parentId` y la relacion `ParentChildren`; se agregan campos escalares: `parentName`, `parentLastName`, `parentRelationship`, `parentPhone`, `parentEmail?`, `parentCarnet`. La URL del carnet/ID se guarda como dato del nino.
- **Rationale**: la spec `user-roles` prohibe usuarios tutores; con un CRUD simple y sin cuenta, la informacion vive en el registro del nino.
- **Alternativa considerada**: `Tutor` como modelo propio sin relacion a `User`. Descartada: agrega un CRUD mas sin necesidad actual; el portal futuro podra introducirlo.

### D2. Endpoints por recurso con guards globales
`findAll/findOne/create/update/remove` en cada modulo, con `JwtAuthGuard` global y `@Roles()` por endpoint.
- **ADMIN/PERSONAL_ADMINISTRATIVO**: CRUD en children, enrollments, payments.
- **ESPECIALISTA**: Read de children asignados (filtrado por `specialistId = req.user.id`) y 403 en enrollments/payments.
- **Rationale**: cumple la Permission Matrix de `user-roles` y reutiliza infraestructura existente.
- **Alternativa**: guardias por modulo personalizados. Descartada: mas codigo, sin beneficio.

### D3. `PATCH /auth/me` para autogestion de datos propios
Se agrega en el modulo Auth (no en Users) porque es autogestion del usuario autenticado; `role`/`isActive` se ignoran; unicidad de email validada con 409. El cambio de contrasena reutiliza `PATCH /auth/password` (ya implementado, revoca refresh tokens).
- **Rationale**: los campos editables son solo los del propio `User`; no se toca el RBAC de Users (exclusivo ADMIN).

### D4. Frontend: pagina `/profile` + store
- Nueva pagina `(dashboard)/profile/page.tsx` (dos tarjetas: "Mis datos" y "Cambiar contrasena"), accesible desde `UserMenu`.
- `auth-store` gana `updateProfile()` y reutiliza `changePassword()` via `api.patch("/auth/password", ...)`.
- **Rationale**: follow de la estructura existente (forms con react-hook-form + zod + sonner toast).

### D5. Migracion y seed
Una migracion Prisma que (1) elimina la relacion `parentId`, (2) agrega los campos escalares de tutor, (3) actualiza el seed para poblar los nuevos campos reusando los datos existentes si hay registros. Sin datos productivos que conservar, se acepta la regeneracion del seed.

## Risks / Trade-offs

- [Perdida de datos de tutor al migrar si existieran ninos con `parentId`] → El seed se actualiza en la misma migracion; no hay datos productivos reales en el entorno de desarrollo. Si aparecieran, se extraeran `name/lastName` del `User` padre antes de borrar la relacion.
- [`PATCH /auth/me` puede chocar con la unicidad de email] → Validacion explicita + `PrismaClientKnownRequestError` P2002 mapeado a 409.
- [Especialista filtra por `specialistId`, pero el `User.id` del especialista != `Specialist.id`] → Filtrar usando el perfil `Specialist` del usuario autenticado (buscar `Specialist.userId = req.user.id` y usar su `id`); se documenta en tareas.
- [Cambio BREAKING en `Child` requiere regenerar el client Prisma y romper codigo que use `parentId`] → Aplicar migracion + `prisma generate` en el mismo paso; el backend no tiene consumidores de `parentId` aun.
- [REQ de pending payments con agregacion en Prisma MySQL (sin groupBy complejo)] → Calcular en el servicio con queries simples por nino/periodo y suma en memoria (volumen bajo del consultorio).

## Migration Plan

1. `npx prisma migrate dev --name add_tutor_embedded_fields` (rompe y regenera client: `prisma generate`).
2. Actualizar `seed.ts` con el nuevo shape de `Child`.
3. Implementar modulos backend (children → enrollments → payments) e integrar en `app.module.ts`.
4. Agregar `PATCH /auth/me` y sus DTO.
5. Frontend: tipos, `updateProfile` en store, pagina `/profile`, wiring del `UserMenu`.
6. Verificacion: `npm run build` + `npm run lint` en backend y fronted; smoke de endpoints con curl (login admin → CRUD children/enrollments/payments, ESPECIALISTA → 403 en enrollments, perfil PATCH/Auth).
   - Rollback: revertir la migracion con `prisma migrate dev` + revertir commits; no hay release con datos reales.

## Open Questions

- Queda pendiente decidir (fuera de scope) si `enrollmentDate`/`monthlyFee` deben sincronizarse automaticamente al crear una inscripcion con estado ACTIVO (las specs los mantienen independientes por ahora).