## Context

El portal público ya existe (`public.controller.ts`, `public.service.ts`,
`PublicChildProfileDto`) y usa una lista blanca de campos. El dueño pidió mostrar
todo con el QR. Hay que ampliar la lista blanca a propósito y regenerar el PDF.

## Goals / Non-Goals

**Goals**

- Exponer diagnóstico, inscripciones, asistencias, actividades e informes.
- PDF resumido.
- Página pública enriquecida.

**Non-Goals**

- No hay autenticación de padres.
- No hay reporte de quién consultó (auditoría de portal público) en esta ronda.

## Decisions

### D1: Ampliar la lista blanca explícitamente

Se sigue `select` explícito en Prisma: nada se expone por accidente. Ahora la
lista incluye `diagnostico`, `attendances`, `activities`, `enrollments` e
informes visibles.

### D2: PDF reutiliza el generador de `reports`

La lógica de PDF vive en un helper compartido (`PdfService` o util) para no
duplicar el formato entre `/reports/:id/pdf` y el resumen público.

### D3: Visibilidad de informes

Solo se publican informes con `isDraft=false` y `visibilityToParents=true`.

## Risks / Trade-offs

- **Privacidad de menores** → riesgo aceptado por el dueño; documentado.
- **Payload grande** → el historial completo puede ser voluminoso; se limita por
  rango razonable (por ejemplo, últimos 24 meses de asistencias) y se documenta.

## Migration Plan

Sin migración de base de datos: solo cambian consultas, DTOs y UI.

## Open Questions

- Si más adelante se quiere cerrar el portal (validar carnet del tutor), es
  revertir a `visibilityToParents` + validación; la spec ya deja el campo.
