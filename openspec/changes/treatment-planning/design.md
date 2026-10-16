## Context

`Child.specialistId` ya limita el alcance del especialista (patrón usado en
`children.controller.ts` con `resolveSpecialistScope`). Reutilizamos ese patrón
para filtrar planes, agenda y notas.

## Goals / Non-Goals

**Goals**

- Planes de tratamiento por niño/área con frecuencia diaria o semanal.
- Ítems repetibles (opcionalmente por día) hasta que la sesión ocurre.
- Notas de evolución con observación, base del informe evolutivo.
- Agenda del especialista por día y semana.

**Non-Goals**

- No hay plantillas de plan reutilizables (se pueden copiar a mano).
- No hay recordatorios ni notificaciones en esta ronda (van con
  `realtime-notifications`).
- No se cruza con asistencia: la "sesión" se infiere de la nota registrada.

## Decisions

### D1: `TreatmentPlanItem` sin estado de cumplimiento

Los ítems se repiten; el "hecho" se deriva de que exista una `EvolutionNote` con
ese `planItemId` y fecha. No se agrega tabla de cumplimiento para no duplicar la
fuente de verdad.

### D2: `EvolutionNote` pertenece al niño, no al plan

Una nota puede existir sin plan (observación suelta) y sobrevivir a la
desactivación de un plan. `planItemId` es opcional.

### D3: Agenda calculada en el backend

`GET /planning/agenda` resuelve vigencia (fecha dentro del plan) y día de la
semana en el servidor, para no replicar reglas en el frontend.

## Risks / Trade-offs

- **Planes sin fin** → `endDate` opcional; un plan sin fin sigue vigente hasta
  desactivarlo.
- **Zona horaria**: se usa `America/La_Paz` de forma consistente con el resto del
  sistema al calcular el día.

## Migration Plan

1. `npx prisma migrate dev --name treatment_planning`.
2. `npx prisma generate`.

Rollback: eliminar las tres tablas nuevas.

## Open Questions

- Si el centro quiere plantillas por especialidad, es una extensión posterior.
