## Context

`Specialist` y `Area` ya existen. `Child.specialistId` referencia `Specialist`.
El backend sigue el patrón NestJS `controller / service / dto` con
`JwtAuthGuard` + `RolesGuard`; el frontend es Next.js App Router con Tailwind y
componentes shadcn-style.

MySQL corre con `lower_case_table_names=0`: los nombres de tabla van en
PascalCase (`SpecialistSchedule`, no `specialist_schedule`).

## Goals / Non-Goals

**Goals**

- CRUD de especialistas asociados a `User`.
- Horario semanal por turno o personalizado.
- Áreas cubiertas (N:N con `Area`).
- Asignación de niños.
- Pagos/sueldo con períodos mensuales derivados de la fecha de ingreso.

**Non-Goals**

- No se crea el `User` automáticamente: el ADMIN lo crea antes (o en el mismo
  formulario enviando datos de usuario) y luego el perfil de especialista.
- No hay nómina automática ni descuentos: los pagos son registros manuales.
- No hay control de asistencia del especialista (RRHH futuro).

## Decisions

### D1: El especialista referencia un `User` existente

`Specialist.userId` es `@unique`. El alta de especialista pide `userId`; la UI
ofrece la lista de usuarios con rol `ESPECIALISTA` que aún no tienen perfil. Así
no se duplican credenciales ni se crean usuarios "fantasma".

### D2: Horario por turno o personalizado en un único modelo

Se usa un solo modelo `SpecialistSchedule` con `shift` opcional y `startTime`/
`endTime` opcionales: si viene `shift` se ignoran las horas; si no, las horas son
obligatorias. Se prefiere esto a dos tablas porque el consumidor (la vista de
agenda) los trata igual.

### D3: Reemplazo total en horarios, áreas y niños

`PUT` de horario/áreas y `PATCH` de niños reemplazan el conjunto completo. Es más
simple y menos propenso a errores que operaciones incrementales desde la UI, y
el volumen es bajo (pocos días, pocas áreas, pocos niños).

### D4: Períodos mensuales derivados de `entryDate`

El endpoint `GET /specialists/:id/payments` devuelve el historial; un helper
`GET /specialists/:id/payment-periods` (o cálculo en el frontend) propone los
períodos mensuales desde `entryDate` hasta hoy para saber qué meses están
pagados. El cálculo de "pagado" es por solapamiento de período.

### D5: Desactivar en lugar de borrar

`Specialist.isActive` ya existe. No se borra físicamente un especialista con
niños o pagos: se desactiva.

## Risks / Trade-offs

- **Un especialista inactivo sigue referenciado por niños** → esperado; los
  reportes históricos lo conservan.
- **Sin sueldo definido** → `monthlySalary` es opcional; la UI lo muestra como
  "sin sueldo configurado".

## Migration Plan

1. `npx prisma migrate dev --name specialists_module`.
2. `npx prisma generate`.
3. `npx prisma migrate deploy` en otros entornos.

Rollback: eliminar las tablas nuevas y las columnas `entryDate`/`monthlySalary`.

## Open Questions

- Si se requiere control de asistencia y vacaciones del especialista, es un
  change de RRHH aparte.
