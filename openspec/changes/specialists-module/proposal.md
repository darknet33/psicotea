## Why

El modelo `Specialist` existe en `prisma/schema.prisma` desde el inicio, pero
**no tiene módulo ni endpoints ni página**: nadie puede crear, listar ni editar
especialistas. Como `Child.specialistId` ya referencia a `Specialist`, hoy es
imposible asignar un especialista a un niño (el campo existe pero no hay forma
de poblarlo), y el rol `ESPECIALISTA` no tiene perfil profesional asociado.

La llamada con el centro pidió además tres cosas que no están modeladas:

1. **Horarios**: la administradora elige en qué turnos/días trabaja cada
   especialista.
2. **Áreas**: cada especialista cubre ciertas áreas; el catálogo ya existe
   (`enrollment-area-catalog`) pero no se relaciona con especialistas.
3. **Pagos/sueldo**: el centro paga al especialista mensualmente, tomando como
   base su **fecha de ingreso**, y necesita controlar esos pagos.

## What Changes

- **CRUD de `Specialist`** (`GET/POST/PATCH/DELETE /specialists`) sobre el modelo
  ya existente, asociado a un `User` con rol `ESPECIALISTA`.
- **Campos nuevos** en `Specialist`: `entryDate` (fecha de ingreso, base del
  cálculo mensual) y `monthlySalary`.
- **`SpecialistSchedule`**: por especialista y día de la semana, un turno
  predefinido (`MANANA` 9:00–12:30, `TARDE` 14:00–17:30, `AMBOS`) **o** una hora
  de inicio/fin personalizada.
- **`SpecialistArea`**: relación N:N entre especialistas y el catálogo `Area`.
- **`SpecialistPayment`**: pagos/sueldo al especialista, con período (derivado
  mensualmente de `entryDate`), fecha de pago, monto, método y notas.
- **Asignación de niños**: `PATCH /specialists/:id/children` para asignar los
  niños que atiende (complementa `Child.specialistId`).
- **Página `/specialists`** (ADMIN): listado, alta/edición, horarios, áreas,
  niños asignados y pagos.

## Capabilities

### New Capabilities
- `specialists`: gestión de especialistas, sus horarios, áreas cubiertas, niños
  asignados y pagos/sueldo.

### Modified Capabilities
- `children`: se explicita que la asignación de especialista se administra
  también desde el módulo de especialistas (sin cambiar la regla de `specialistId`).

## Impact

- **Base de datos**: tablas nuevas `SpecialistSchedule`, `SpecialistArea`,
  `SpecialistPayment`; columnas nuevas `entryDate`, `monthlySalary` en
  `Specialist`.
- **Backend**: módulo nuevo `backend/src/specialists/` y registro en
  `app.module.ts`.
- **Frontend**: `fronted/src/app/(dashboard)/specialists/page.tsx` (la entrada
  del sidebar ya existe), `fronted/src/lib/api/specialists.ts` y
  `fronted/src/types/specialist.ts`.
- **Datos existentes**: no se modifican. Los especialistas actuales (si los
  hubiera) quedan sin horario ni sueldo hasta que el ADMIN los complete.
