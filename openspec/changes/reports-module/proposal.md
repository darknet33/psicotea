## Why

`Report` existe en el schema como esbozo (`title`, `content`, `periodStart`,
`periodEnd`, `isDraft`, `pdfUrl`) sin módulo, sin UI y sin tipos. La llamada con
el centro pidió tres informes concretos:

1. **Informe de evaluación** del niño **al ingresar**.
2. **Informe evolutivo** por niño, que el especialista arma consultando las
   **notas de evolución** (`treatment-planning`).
3. **Informes periódicos** a **principios, mediados y finales de año**, con
   **carga de documentos** que los padres podrán ver en el portal público.

Hoy el portal público solo lista `title`/período de los informes no borrador,
porque no hay contenido real ni adjuntos.

## What Changes

- **`Report` extendido**: `type` (`EVALUACION` | `EVOLUTIVO` | `PERIODICO`),
  `reportPeriod` (`INICIO` | `MEDIADOS` | `FIN` | `NINGUNO`),
  `visibilityToParents` (bool) y `summary` opcional.
- **`ReportAttachment`**: documentos adjuntos (reusa el módulo `uploads`
  ampliándolo para aceptar PDF).
- **CRUD de informes** con filtros por niño, tipo, especialista y período.
- **Generación de informe evolutivo** que consolida las `EvolutionNote` del niño
  en un rango, prellenando `content`.
- **Descarga de PDF** de un informe.
- **RBAC**: ESPECIALISTA CRUD de sus niños; ADMIN todo; PERSONAL sin acceso.

## Capabilities

### New Capabilities
- `reports`: informes de evaluación, evolutivos y periódicos, con adjuntos y PDF.

### Modified Capabilities
- `uploads`: se admite la carga de documentos PDF (además de imágenes) para los
  adjuntos de informes.

## Impact

- **Base de datos**: columnas nuevas en `Report`; tabla nueva `ReportAttachment`.
- **Backend**: módulo `backend/src/reports/`; ajuste en `uploads` para PDF.
- **Frontend**: `fronted/src/app/(dashboard)/reports/page.tsx` (la entrada del
  sidebar ya existe), cliente y tipos.
- **Datos existentes**: los informes actuales quedan con `type` por defecto
  (`EVOLUTIVO`) y `visibilityToParents` en `false`.

## Nota de privacidad

El requisito original (`project.md` §19/§21 y la spec `public-child-portal`)
prohibía exponer el contenido clínico. El dueño decidió (ver
`public-child-portal-enhancement`) que el portal público **sí** muestre los
informes. Por eso `visibilityToParents` queda como control explícito: solo los
informes marcados se publican, y el cambio de política se documenta en
`public-child-portal-enhancement`.
