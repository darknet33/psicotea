## Why

El portal público (`child-credential-qr`) hoy muestra solo datos básicos del niño,
el tutor principal y una lista de títulos/periodos de informes. La llamada con el
centro pidió:

> "Consultas públicas por niño para ver el historial y los datos no necesita
> tener cuenta."

El dueño decidió que el portal muestre **todo** (historial, asistencias, informes,
diagnóstico) con solo abrir la URL del QR, **sin validación adicional**, y que se
pueda **generar un PDF resumido**.

Esto **cambia una decisión previa** de privacidad: la spec `public-child-portal`
excluía explícitamente `diagnostico` y el contenido de los informes. Se modifica
ese requisito.

## What Changes

- **Ampliar el DTO público** `PublicChildProfileDto`: agrega `diagnostico`,
  `enrollments` (resumen), `attendances` (historial), `activities` e `informes`
  con contenido (`content`, `type`, `reportPeriod`, adjuntos visibles).
- **Endpoint de PDF resumido**: `GET /public/children/credential/:code/summary.pdf`.
- **Página pública** `/publico/nino/[code]`: secciones de historial, asistencias,
  informes y botón "Descargar resumen PDF".
- **Modificación de política**: se relaja `project.md` §21 y la spec
  `public-child-portal` para reflejar la decisión del dueño.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `public-child-portal`: el DTO deja de excluir `diagnostico` y el contenido de
  los informes; se agregan asistencias, actividades, historial y PDF resumido.

## Impact

- **Backend**: `public.service.ts`, `public.controller.ts` y
  `dto/public-child-profile.dto.ts`.
- **Frontend**: `fronted/src/app/(public)/publico/nino/[code]/page.tsx`,
  `src/lib/api/public-child.ts`, `src/types/public-child.ts`.
- **Documentación**: `openspec/project.md` §19/§21 y
  `openspec/specs/...` deben actualizarse para no contradecir el nuevo
  comportamiento.

## Riesgo aceptado

Cualquier persona que escanee una credencial ve el diagnóstico del niño. El dueño
lo aceptó explícitamente; se documenta para que quede como decisión consciente.
