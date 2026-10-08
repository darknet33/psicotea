## 1. Modelo de datos

- [x] 1.1 Agregar `model Area` a `prisma/schema.prisma` con `id`, `name` (`@unique`), `description?`, `isActive` (default `true`), `enrollments EnrollmentArea[]`, `createdAt`, `updatedAt`
- [x] 1.2 Agregar `model EnrollmentArea` con `@@id([enrollmentId, areaId])`, FK a `Enrollment` con `onDelete: Cascade` y FK a `Area`, más `@@index([areaId])`
- [x] 1.3 Agregar `areas EnrollmentArea[]` a `model Enrollment`
- [x] 1.4 Generar la migración con `npx prisma migrate dev --name enrollment_area_catalog` y revisar el SQL: los nombres de tabla deben ir en mayúscula (`Area`, `EnrollmentArea`, `Child`) porque MySQL corre con `lower_case_table_names=0`
- [x] 1.5 Ejecutar `npx prisma generate` y `npx prisma migrate status` para confirmar que no queda pendiente

## 2. Módulo de áreas (backend)

- [x] 2.1 Crear `src/areas/dto/create-area.dto.ts` con `name` (`@IsNotEmpty`, `@IsString`, `@MaxLength(80)`) y `description` opcional (`@MaxLength(191)`)
- [x] 2.2 Crear `src/areas/dto/update-area.dto.ts` con los tres campos opcionales vía `PartialType(CreateAreaDto)`
- [x] 2.3 Crear `src/areas/dto/query-areas.dto.ts` con `includeInactive` booleano opcional usando `@Type(() => Boolean)`
- [x] 2.4 Crear `src/areas/areas.service.ts` con `findAll`, `findOne`, `create`, `update`, traduciendo el `P2002` de Prisma a un `BadRequestException` con mensaje de nombre duplicado
- [x] 2.5 En `findAll`, filtrar por `isActive` salvo que `includeInactive` sea `true`, y ordenar por `name` ascendente
- [x] 2.6 Crear `src/areas/areas.controller.ts` con `@Controller('areas')`, `@UseGuards(JwtAuthGuard, RolesGuard)`: `@Roles(ADMIN, PERSONAL_ADMINISTRATIVO)` en los `@Get` y `@Roles(ADMIN)` en `@Post` y `@Patch`
- [x] 2.7 Crear `src/areas/areas.module.ts` importando `PrismaModule` y registrar `AreasModule` en `src/app.module.ts`
- [x] 2.8 Crear `src/areas/areas.service.spec.ts` cubriendo: listado con y sin inactivas, nombre duplicado → 400, área inexistente → 404, desactivación y reactivación
- [x] 2.9 Confirmar que el `ValidationPipe` global rechaza campos desconocidos, de modo que un `PATCH /areas/:id` con `id` o `createdAt` devuelve 400

## 3. Seed

- [x] 3.1 Agregar a `prisma/seed.ts` un conjunto inicial de áreas típicos de intervención infantil, insertadas con `upsert` sobre `name` para que el seed sea idempotente y no pise ediciones del ADMIN
- [x] 3.2 Verificar que `npx prisma db seed` se puede correr dos veces seguidas sin duplicar ni resetear descripciones

## 4. Frontend

- [x] 4.1 Crear `src/types/area.ts` con `Area`, `AreaInput` y `AREA_ROLES`
- [x] 4.2 Crear `src/lib/api/areas.ts` con `listAreas(includeInactive?)`, `getArea(id)`, `createArea(input)` y `updateArea(id, input)`
- [x] 4.3 Crear `src/components/forms/area-form.tsx` con `react-hook-form` + `zod`, diálogo de alta/edición y estados de envío
- [x] 4.4 Crear `src/app/(dashboard)/areas/page.tsx` con tabla de áreas (nombre, descripción, estado), alternador de activar/desactivar y estados de carga/vacío/error, mostrando las inactivas atenuadas
- [x] 4.5 Agregar la entrada "Áreas" a la sección "Gestión" de `src/components/layout/sidebar.tsx` con `roles: ["ADMIN"]`
- [x] 4.6 Filtrar `/areas` por rol en la propia página, para que un usuario que teclee la URL sin permiso reciba el 403 del backend y no un error de cliente

## 5. Verificación

- [x] 5.1 `cd backend && npm run lint && npm run build`
- [x] 5.2 `cd fronted && npm run lint && npm run build`
- [x] 5.3 `openspec validate enrollment-area-catalog --type change --strict`
- [x] 5.4 Con el backend arriba, `curl` como ADMIN: `GET /areas` devuelve 200 con el seed; `POST /areas` con nombre duplicado devuelve 400
- [x] 5.5 `curl` como `PERSONAL_ADMINISTRATIVO`: `GET /areas` 200 y `POST /areas` 403
- [x] 5.6 `curl` como `ESPECIALISTA`: `GET /areas` 403
- [x] 5.7 Verificar que `/areas` no aparece en el sidebar del ESPECIALISTA ni del PERSONAL_ADMINISTRATIVO
- [x] 5.8 Desactivar un área, comprobar que desaparece de `GET /areas` y que sigue visible con `?includeInactive=true`, y que se puede reactivar
