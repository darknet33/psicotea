## Context

`Enrollment` no tiene ninguna dimensión de "áreas de trabajo". `project.md` §5 pide un "servicio o modalidad correspondiente, si aplica" desde la especificación original, pero nunca se modeló. Hoy no existe ningún catálogo: no hay entidad, ni endpoint, ni tabla.

El backend es NestJS 10 + Prisma 5 sobre MySQL 8. Los módulos siguen el patrón `controller / service / dto` con `JwtAuthGuard` + `RolesGuard` y el decorador `@Roles`. El frontend es Next.js 16 (App Router) con Tailwind y componentes shadcn-style.

Restricciones relevantes:

- MySQL corre con `lower_case_table_names=0`, así que los nombres de tabla en las migraciones son sensibles a mayúsculas: hay que escribir `Area`, no `area`.
- Los nombres de modelo de Prisma coinciden con el nombre de tabla, y las migraciones ya aplicadas usan esa convención (`Child`, `ChildTutor`, `RefreshToken`).
- `child-photo-diagnosis-fields` dejó una migración que requería un backfill previo de datos; conviene evitar que el seed o la migración dependan del orden de ejecución de otra migration.

## Goals / Non-Goals

**Goals:**

- Catálogo de áreas administrable, con nombre único y desactivación en lugar de borrado.
- Relación N:N con `Enrollment`, para que una inscripción abarque varias áreas.
- Lectura del catálogo disponible para quien gestiona inscripciones, escritura restringida al ADMIN.
- Página de administración filtrada por rol.
- Un conjunto inicial de áreas seedeado para que el catálogo arranque con contenido real.

**Non-Goals:**

- No se engancha el catálogo al formulario de inscripción: eso llega con `enrollment-schedule-balance-and-detail`.
- No hay borrado físico de áreas.
- No se definen las áreas concretas del centro: el seed propone un conjunto inicial razonable y el ADMIN ajusta.
- No se agrega precio, horario ni capacidad por área.
- No hay auditoría de quién creó o editó un área.

## Decisions

### D1: Desactivar en lugar de borrar (`isActive`) en vez de borrado físico

Un área borrada dejaría `EnrollmentArea` huérfanas y perdería el historial de en qué áreas estaba el niño en una inscripción pasada. Se prefiere `isActive: Boolean @default(true)`.

- Alternativa considerada: borrar en cascada. Rechazada porque destruye información histórica.
- Alternativa considerada: `deletedAt` de borrado lógico. Rechazada porque no aporta nada frente a `isActive` para este caso, que además tiene significado de negocio real (un área puede dejar de ofrecerse sin desaparecer del historial).

Consecuencia: `name` es único sobre **todo** el catálogo, no solo entre las activas. Si un área se llama "Terapia Ocupacional" y se desactiva, no se puede crear otra con ese nombre; hay que reactivarla. Esto se documenta explícitamente en la spec porque es la decisión más contraintuitiva del módulo.

### D2: Tabla de unión explícita (`EnrollmentArea`) en vez de relación implícita

Prisma genera una tabla de unión N:N automáticamente cuando ambos lados son muchos-a-muchos, pero esa tabla no admite atributos propios ni `@@id` compuesto con nombre estable. Al declarar `EnrollmentArea` explícitamente se controla el nombre de la FK, se puede poner `onDelete: Cascade` desde `Enrollment`, y queda lugar para agregar atributos después sin migrar.

- Alternativa considerada: `areas Area[]` en ambos lados y dejar que Prisma cree `_AreaToEnrollment`. Rechazada por el control de la cascada y por no dejar margen a extender.

`onDelete: Cascade` solo desde el lado de `Enrollment`: si se borra un área (que no debería ocurrir, pero por integridad referencial) las inscripciones que la tenían quedan sin esa área en lugar de desaparecer.

### D3: Permisos asimétricos — lectura para dos roles, escritura solo ADMIN

La lectura del catálogo la necesita cualquiera que pueda crear una inscripción (`ADMIN`, `PERSONAL_ADMINISTRATIVO`), porque el formulario la va a consumir. La escritura se limita al ADMIN para que el catálogo no se fragmente entre varias personas escribiendo con grafías distintas.

Es un compromiso deliberado con `user-roles`, donde la Permission Matrix es CRUD completo por rol. Se prefiere el criterio de "quién mantiene la integridad del dato maestro" sobre el de "simetría de permisos", porque un catálogo de áreas es un dato maestro, no un registro transaccional.

- Alternativa considerada: abrir el CRUD a `PERSONAL_ADMINISTRATIVO`. Rechazada por el riesgo de fragmentación del catálogo.
- Alternativa considerada: cerrar el `GET` a `ESPECIALISTA` y abrirlo más adelante. La spec ya deja `ESPECIALISTA` con 403 en lectura; si más adelante se necesita, es un cambio de una línea en la spec y en el decorador.

### D4: `name` único a nivel de base, no solo en el service

La unicidad se delega a `@@unique([name])` en MySQL, no a una comprobación previa en el service. Motivo: una comprobación en el service tiene una condición de carrera entre dos peticiones concurrentes; el índice único no. El service traduce el error `P2002` de Prisma a un 400 con un mensaje entendible.

El collation por defecto de MySQL (`utf8mb4_unicode_ci`) ya hace la comparación insensible a mayúsculas y acentos, que es el comportamiento deseado para un catálogo que el personal escribe a mano.

### D5: Seed idempotente con `upsert`

El seed de áreas usa `upsert` sobre `name`. Es idempotente y no destructivo: corre las veces que haga falta sin duplicar ni pisar descripciones que el ADMIN haya editado. Un `createMany` con `skipDuplicates` sería equivalente, pero `upsert` deja el patrón explícito para cuando haga falta actualizar la descripción.

## Risks / Trade-offs

- **Catálogo inicial inventado** → El seed propone áreas típicas de intervención infantil. El ADMIN edita nombres y descripciones. Mitigación: el seed es idempotente y no pisa cambios posteriores.
- **Un área desactivada bloquea su nombre para siempre** → Puede confundir a quien intente crear un área nueva con un nombre parecido. Mitigación: el mensaje de 403/400 dice explícitamente que el nombre ya existe en el catálogo y que se reactive en lugar de duplicar; la página `/areas` muestra las inactivas por defecto justamente para que esa área sea visible y reactivable.
- **Permisos asimétricos, fáciles de olvidar** → Mitigación: la matriz está en tabla dentro de la spec `areas`, y la página está oculta en el sidebar para los roles sin acceso.
- **`ENROLLMENT_ROLES` duplicado** → La constante de roles ya existe en `enrollments.controller.ts` y habrá que repetirla en `areas.controller.ts`. Mitigación: pendiente evaluar un helper compartido en `common/`; para este change se duplica y se acepta, porque son dos listas distintas (lectura vs escritura).

## Migration Plan

1. `npx prisma migrate dev --name enrollment_area_catalog` — genera `Area` y `EnrollmentArea`, y agrega `areas EnrollmentArea[]` a `Enrollment`. No modifica ni borra datos existentes.
2. `npx prisma generate` para refrescar el cliente.
3. `npx prisma migrate deploy` en otros entornos.
4. `npx prisma db seed` para cargar las áreas iniciales.

Rollback: `npx prisma migrate reset` y volver a `migrate deploy` desde una base limpia. Como las tablas son nuevas y las inscripciones existentes no las referencian, no hay paso de migración de datos que deshacer.

## Open Questions

- Si el centro necesita que un área tenga capacidad máxima o lista de espera, eso sería una capacidad nueva y no parte de este change.
- Si las áreas deben filtrar los reportes de gastos (§12.2 de `project.md` lista categorías de gasto, que es un concepto distinto), habría que decidir si se reutiliza este catálogo o se mantiene separado.
