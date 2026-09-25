## Context

Hoy el tutor vive embebido en `Child` (`parentName`, `parentLastName`, `parentRelationship`, `parentPhone`, `parentEmail`, `parentCarnet`), lo que impide múltiples responsables y compartir un tutor entre hermanos. El sexo acepta valores mixtos (`M | F | Masculino | Femenino`), las fechas usan `<input type="date">` nativo y no se muestra la edad calculada. La BD de niños/inscripciones/pagos quedó vacía tras una limpieza reciente, así que el cambio de modelo no requiere migración de datos existente. El backend es NestJS + Prisma/MySQL; el frontend es Next.js (App Router) con react-hook-form + zod + shadcn/ui.

## Goals / Non-Goals

**Goals:**
- Tutor como entidad reutilizable con relación N:N a niño (parentesco por vínculo, un tutor principal).
- Sexo acotado a `Varón | Mujer` en DTOs, zod y opciones del formulario.
- Edad calculada (años y meses) en listado y expediente.
- Selector de fecha desglosado Día/Mes/Año como estándar en todos los formularios con fechas.
- Renombrar la etiqueta del campo de contacto a "Celular/WhatsApp".

**Non-Goals:**
- Página CRUD de tutores independiente (se gestiona embebido en el alta/edición de niño en esta iteración).
- Portal/login para tutores (siguen sin ser usuarios del sistema).
- Migración de datos históricos (BD vacía; solo se actualiza `seed.ts`).

## Decisions

**D1. Modelo N:N con tabla puente `ChildTutor`.**
`Child` elimina los campos `parent*` y declara `tutors ChildTutor[]`. `Tutor` con `carnet` único (`@@unique([carnet])`). `ChildTutor` con `(childId, tutorId)`, `relationship`, `isPrimary` y `@@unique([childId, tutorId])`; `childId` y `tutorId` con `onDelete: Cascade`.
- *Alternativa descartada*: reutilizar `User`/`Specialist` como tutor — mezclaría roles y login; los tutores no acceden al sistema.
- *Alternativa descartada*: campos embebidos repetidos — no permite reutilizar un tutor entre niños.

**D2. Reutilización del tutor por `carnet` (upsert, no duplicación).**
En `children.service.create`/se usa `carnet` como clave de búsqueda; se crea el `Tutor` si no existe, o se reutiliza el existente, y luego se recrean los vínculos `ChildTutor`. En `update` se borran los vínculos previos (`deleteMany`) y se reconstruyen. Si el `carnet` no es único, el índice de la BD lo impide a nivel físico.
- *Alternativa descartada*: deduplicar por nombre — propenso a colisiones de personas distintas con el mismo nombre.

**D3. `isPrimary` sin índice único parcial.**
MySQL no soporta unique index parcial, así que "exactamente un principal" se valida en el servicio (400 si 0 o >1). Se conserva la consistencia vía transacción Prisma.

**D4. Edad calculada en el frontend.**
Helper `formatAge(dateOfBirth)` en `lib/format.ts` (mismos `TIME_ZONE`) aplicado en `children/page.tsx` y `children/[id]/page.tsx`.
- *Alternativa descartada*: devolver `age` desde el backend — amplía el contrato del API sin necesidad; la fecha ya viaja en respuesta.

**D5. Selector `date-selects` reutilizable.**
Nuevo componente `components/forms/date-selects.tsx`: tres `<select>` (Día/Mes/Año), meses en español, días validados por mes/año (bisiestos), emite `YYYY-MM-DD`. Se integra como campo controlado en `child-form` (`dateOfBirth`, `enrollmentDate`), `enrollment-form` (`startDate`) y `payment-form` (`paymentDate`). Es el estándar para futuros campos de fecha.

**D6. Sexo como constante única.**
`SEX_OPTIONS = ["Varón", "Mujer"]` en `types/child.ts`, `z.enum(["Varón","Mujer"])` en el form y `@IsIn(['Varón','Mujer'])` en DTOs; la columna sigue siendo `String` en BD.

## Risks / Trade-offs

- [Valores de `sex` nuevos rompen integración si existían datos previos] → BD limpia; `seed.ts` actualizado a `Mujer`; no hay datos históricos que migrar.
- [Dos tutores distintos escriben el mismo `carnet` (error de tipeo) y se fusionan al reutilizar] → el índice único + validación en UI lo previene; si ocurre, es corregible manualmente en BD.
- [Edad calculada depende de la zona horaria del cliente] → se reutiliza `TIME_ZONE = America/La_Paz` de `lib/format.ts` para consistencia entre listado y expediente.
- [Borrado de vínculos en `update` puede desvincular tutores no enviados accidentalmente] → el formulario siempre envía la lista completa de tutores; el contrato es de reemplazo total.
- [`select` anidados complican útil móvil] → tres selects cortos en grid responsive; accesibles con labels (`Día`/`Mes`/`Año`).

## Migration Plan

1. Modificar `schema.prisma`; ejecutar `npx prisma migrate dev --name tutors_many_to_many` (tabla vacía, sin backfill de datos).
2. `npx prisma generate`.
3. Actualizar backend: DTOs, `children.service`, `seed.ts`.
4. Actualizar frontend: tipos, `format.ts`, `date-selects`, formularios y páginas.
5. Verificar con build/lint de backend y frontend y prueba manual del flujo de alta.

Rollback: reversión de código vía git; para BD, la migración hacia atrás (`migrate dev` con la migración previa) restaura el esquema embebido (sin datos que preservar).

## Open Questions

- ¿La vista "Tutores" independiente (CRUD + búsqueda) se desea en esta iteración o en una futura? (Por ahora gestionada desde el formulario del niño).