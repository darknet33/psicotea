## Context

`Report` existe como esbozo. El especialista se identifica por `User` (`Report.specialistId` apunta a `User`, igual que hoy). El módulo `uploads` ya sirve archivos en `/uploads/*` y valida imágenes; hay que ampliarlo para PDF.

## Goals / Non-Goals

**Goals**

- Tres tipos de informe con período académico.
- Prellenado del evolutivo desde notas de evolución.
- Adjuntos y PDF.
- Visibilidad explícita para el portal público.

**Non-Goals**

- No hay plantillas configurables (futuro).
- No hay firma digital.
- No hay aprobación/revisión por un segundo rol.

## Decisions

### D1: `specialistId` apunta a `User` (como el schema actual)

`Report.specialistId` ya referencia `User`. Se mantiene para no migrar datos ni
cambiar `Attendance`/`Activity`, que usan el mismo criterio.

### D2: PDF generado en el backend con `pdfkit`

El backend arma un PDF simple (título, niño, período, contenido) y lo devuelve
como stream. Se prefiere a generar en el cliente porque el informe debe poder
compartirse/imprimirse sin depender del navegador.

### D3: `visibilityToParents` en vez de un tipo "público"

Un mismo informe evolutivo puede querer compartirse o no. El booleano lo
controla sin duplicar entidades.

### D4: Adjuntos por referencia a `/uploads`

No se guardan binarios en MySQL: se guarda `fileUrl` (ruta relativa de
`uploads`), igual que `Child.photoUrl`.

## Risks / Trade-offs

- **PDF con acentos** → `pdfkit` usa fuentes estándar; se usa una fuente que
  soporta Latin-1 y se normalizan saltos de línea.
- **Adjuntos borrados del disco** → el registro se conserva; la UI muestra
  "documento no disponible" si el archivo falta.

## Migration Plan

1. `npx prisma migrate dev --name reports_module`.
2. `npx prisma generate`.

Rollback: eliminar `ReportAttachment` y las columnas nuevas de `Report`.

## Open Questions

- Si se quiere que el informe de evaluación sea obligatorio al crear el niño,
  sería una regla de `children`; por ahora es opcional.
