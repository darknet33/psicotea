## Why

La llamada con el centro pidió:

> "cada especialista si tiene una planificación por día o semana, y con
> observaciones por cada tratamiento."

> "el tratamiento y actividades (nota de evolución) es más a la vista del
> especialista pero es repetitivo hasta que la sesión, pero también se puede
> anotar observación."

Hoy no existe nada de esto. `Activity` y `Report` en el schema son esbozos
genéricos, pero no hay forma de que un especialista:

- Defina **qué trabaja** con cada niño (plan de tratamiento por área).
- Sepa **qué le toca hoy/esta semana** (planificación).
- Deje una **nota de evolución** por sesión, con observación.

Sin esto, el especialista trabaja de memoria y el "informe evolutivo" no tiene
de dónde alimentarse.

## What Changes

- **`TreatmentPlan`**: plan de un especialista para un niño en un área,
  con frecuencia `DAILY`/`WEEKLY`, vigencia (`startDate`/`endDate`) y notas.
- **`TreatmentPlanItem`**: los objetivos/tareas del plan, opcionalmente por día
  de la semana, ordenados. Se repiten hasta que la sesión ocurre.
- **`EvolutionNote`** ("nota de evolución"): registro fechado del especialista
  sobre el niño, opcionalmente ligado a un ítem del plan, con `content` y
  `observation` opcional. Es la fuente del informe evolutivo.
- **Endpoints**: CRUD de planes e ítems por niño asignado; listado "mi
  planificación" (día/semana) para el especialista; CRUD de notas de evolución.
- **Página `/activities` reutilizada como "Planificación"** para el especialista:
  agenda del día/semana con acción para registrar la nota de evolución — o una
  ruta propia `/planning` si se prefiere separar. (Se decide: ruta `/planning`.)

## Capabilities

### New Capabilities
- `treatment-planning`: planes de tratamiento, ítems, notas de evolución y la
  vista de planificación del especialista.

### Modified Capabilities
- Ninguna.

## Impact

- **Base de datos**: tablas nuevas `TreatmentPlan`, `TreatmentPlanItem` y
  `EvolutionNote`.
- **Backend**: módulo `backend/src/planning/`.
- **Frontend**: `fronted/src/app/(dashboard)/planning/page.tsx`, cliente y tipos.
- **Datos existentes**: no se modifican.
