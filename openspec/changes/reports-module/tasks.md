## 1. Modelo de datos

- [x] 1.1 Agregar enums `ReportType` (`EVALUACION`, `EVOLUTIVO`, `PERIODICO`) y `ReportPeriod` (`INICIO`, `MEDIADOS`, `FIN`, `NINGUNO`)
- [x] 1.2 Extender `model Report` con `type`, `reportPeriod`, `visibilityToParents`, `summary`
- [x] 1.3 Agregar `model ReportAttachment`
- [x] 1.4 Migración `20261015120000_specialists_planning_reports` y `prisma generate`

## 2. Backend

- [x] 2.1 DTOs de informe y adjunto
- [x] 2.2 `reports.service.ts` con CRUD, prellenado evolutivo, adjuntos y PDF
- [x] 2.3 `reports.controller.ts` con alcance por especialista
- [x] 2.4 `reports.module.ts` + registro en `app.module.ts`
- [x] 2.5 Ampliar `uploads` con `POST /uploads/document` (PDF)
- [x] 2.6 Instalar `pdfkit` y `@types/pdfkit`
- [x] 2.7 `reports.service.spec.ts`

## 3. Frontend

- [x] 3.1 `src/types/report.ts`
- [x] 3.2 `src/lib/api/reports.ts`
- [x] 3.3 `src/components/forms/report-form.tsx`
- [x] 3.4 `src/app/(dashboard)/reports/page.tsx`
- [x] 3.5 Detalle con adjuntos y descarga de PDF (dentro del formulario de edición)

## 4. Verificación

- [x] 4.1 `cd backend && npm run lint && npm run build`
- [x] 4.2 `cd fronted && npm run lint && npm run build`
- [x] 4.3 `openspec validate reports-module --type change --strict`
