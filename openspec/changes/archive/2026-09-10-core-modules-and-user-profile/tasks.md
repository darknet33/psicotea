## 1. Prisma: Modelo Child y migracion

- [x] 1.1 Actualizar `backend/prisma/schema.prisma`: eliminar `parentId` y la relacion `ParentChildren` en `Child`; agregar campos `parentName`, `parentLastName`, `parentRelationship`, `parentPhone`, `parentEmail?`, `parentCarnet`
- [x] 1.2 Eliminar la relacion `children`/`ParentChildren` del modelo `User` (solo quedan `specialist`, `staff`, `refreshTokens`, `attendanceRecords`, `activityRecords`, `reportRecords`, `expensesCreated`)
- [x] 1.3 Ejecutar `npx prisma migrate dev --name add_tutor_embedded_fields` en `backend/`
- [x] 1.4 Actualizar `backend/prisma/seed.ts` con el nuevo shape de `Child` (datos de tutor embebidos)

## 2. Backend: Modulo Children

- [x] 2.1 Crear `backend/src/children/children.module.ts` (importa PrismaModule)
- [x] 2.2 Crear `children.service.ts` con `findAll`, `findOne`, `create`, `update`, `remove`, `search` y filtros (`isActive`, `specialistId`)
- [x] 2.3 Implementar en el servicio el filtro por especialista: obtener el `Specialist` por `userId = req.user.id` y filtrar `Child.specialistId` por su `id`
- [x] 2.4 Crear `children.controller.ts` con `GET /children` (ADMIN, PERSONAL_ADMINISTRATIVO, ESPECIALISTA-read-asignados), `GET /children/:id`, `POST /children` (ADMIN, PERSONAL), `PATCH /children/:id` (ADMIN, PERSONAL), `DELETE /children/:id` (ADMIN, PERSONAL) usando `@Roles()`
- [x] 2.5 Crear DTOs: `CreateChildDto` y `UpdateChildDto` (class-validator; incluye tutor embebido y `specialistId` opcional con validacion de existente)
- [x] 2.6 Registrar `ChildrenModule` en `backend/src/app.module.ts`

## 3. Backend: Modulo Enrollments

- [x] 3.1 Crear `backend/src/enrollments/enrollments.module.ts`
- [x] 3.2 Crear `enrollments.service.ts` con `findAll`, `findOne`, `findByChild`, `create`, `updateStatus`
- [x] 3.3 Crear `enrollments.controller.ts` con `GET /enrollments`, `GET /enrollments/:id`, `GET /enrollments/child/:childId`, `POST /enrollments`, `PATCH /enrollments/:id` (`@Roles('ADMIN', 'PERSONAL_ADMINISTRATIVO')`)
- [x] 3.4 Crear DTOs `CreateEnrollmentDto`, `UpdateEnrollmentDto` (incluye estado ACTIVO/INACTIVO/RETIRADO y `endDate` al dejarlo de ser ACTIVO)
- [x] 3.5 Registrar `EnrollmentsModule` en `app.module.ts`

## 4. Backend: Modulo Payments

- [x] 4.1 Crear `backend/src/payments/payments.module.ts`
- [x] 4.2 Crear `payments.service.ts` con `findAll`, `findOne`, `findByChild`, `create`, `findByPeriod`, `getPendingPayments`
- [x] 4.3 Implementar `getPendingPayments` (inscripciones ACTIVAS sin pago que cubra su periodo; D1/Riesgos del design: suma en memoria)
- [x] 4.4 Crear `payments.controller.ts` con `GET /payments`, `GET /payments/:id`, `GET /payments/child/:childId`, `GET /payments/period`, `GET /payments/pending`, `POST /payments` (`@Roles('ADMIN', 'PERSONAL_ADMINISTRATIVO')`)
- [x] 4.5 Crear DTOs `CreatePaymentDto`, `UpdatePaymentDto` (monto > 0, `method`, periodo)
- [x] 4.6 Registrar `PaymentsModule` en `app.module.ts`

## 5. Backend: Perfil de usuario

- [x] 5.1 Agregar `PATCH /auth/me` a `auth.controller.ts` con `JwtAuthGuard` y `@Throttle` moderado
- [x] 5.2 Crear `UpdateProfileDto` en `backend/src/auth/dto/` (name, lastName, email; ignorar role/isActive)
- [x] 5.3 Implementar `updateProfile()` en `auth.service.ts` (validar unicidad de email → 409 en P2002)

## 6. Frontend: Perfil de usuario

- [x] 6.1 Crear tipos `UpdateProfileInput` y helper en `fronted/src/types/user.ts` (reutilizar `User`)
- [x] 6.2 Agregar `updateProfile()` y `changePassword()` a `fronted/src/stores/auth-store.ts` (api.patch `/auth/me` y `/auth/password`)
- [x] 6.3 Crear `/fronted/src/app/(dashboard)/profile/page.tsx` con dos tarjetas: "Mis datos" (react-hook-form + zod, `updateProfile`) y "Cambiar contrasena" (`currentPassword`/`newPassword`), con toast de exito/error y navegacion protegida por `ProtectedRoute`
- [x] 6.4 Enlazar "Mi perfil" del `UserMenu` (`fronted/src/components/layout/user-menu.tsx`) a `/profile` usando el componente Link/DropdownMenu ya existente

## 7. Cierre y verificacion

- [x] 7.1 Backend: `npm run build` + `npm run lint` en `backend/`
- [x] 7.2 Fronted: `npm run build` + `npm run lint` en `fronted/`
- [ ] 7.3 Smoke E2E: login admin → crear nino (con tutor embebido), inscribir, registrar pago, listar pagos pendientes; `PATCH /auth/me` y `PATCH /auth/password`; ESPECIALISTA → 403 en enrollments/payments y Read solo asignados en children (OMITIDA por solicitud del usuario; backend detenido)
- [x] 7.4 Marcar como completas las tareas 3.1-3.14 en `openspec/changes/architecture-stack-definition/tasks.md` (Fase 3 ya implementada)
- [x] 7.5 Verificar `openspec validate --change core-modules-and-user-profile` (specs delta en formato ADDED)