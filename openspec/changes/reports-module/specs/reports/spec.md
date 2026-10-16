## ADDED Requirements

### Requirement: Report Types

El sistema SHALL soportar tres tipos de informe: `EVALUACION` (al ingreso del
niño), `EVOLUTIVO` (seguimiento a partir de notas de evolución) y `PERIODICO`
(principios, mediados o finales de año). Cada informe SHALL tener `childId`,
`specialistId`, `title`, `content`, `type`, `reportPeriod` (`INICIO`, `MEDIADOS`,
`FIN` o `NINGUNO`), `periodStart`, `periodEnd`, `isDraft` y
`visibilityToParents`.

- `GET /reports?childId=&type=&specialistId=&from=&to=` — listado
- `GET /reports/:id` — detalle
- `POST /reports` — crear
- `PATCH /reports/:id` — editar
- `DELETE /reports/:id` — eliminar

#### Scenario: Informe de evaluación
- **WHEN** se crea un informe con `type` `EVALUACION` para un niño que ingresa
- **THEN** el sistema lo guarda y aparece en el historial del niño

#### Scenario: Informe periódico
- **WHEN** se crea un informe `PERIODICO` con `reportPeriod` `MEDIADOS`
- **THEN** el sistema lo guarda con ese período

#### Scenario: Contenido vacío
- **WHEN** se crea un informe sin `content`
- **THEN** el sistema devuelve 400

### Requirement: Evolution Report Draft

El sistema SHALL permitir prellenar un informe `EVOLUTIVO` consolidando las
notas de evolución del niño en un rango de fechas.

- `GET /reports/evolution-draft?childId=&from=&to=` — prellenado

#### Scenario: Prellenado
- **WHEN** el especialista solicita el prellenado para un rango
- **THEN** el sistema devuelve un `content` con las notas de evolución del rango, ordenadas por fecha

#### Scenario: Sin notas
- **WHEN** no hay notas de evolución en el rango
- **THEN** el sistema devuelve un `content` vacío sin error

### Requirement: Report Attachments

El sistema SHALL permitir adjuntar documentos a un informe, con `name`,
`fileUrl` y `mimeType`.

- `POST /reports/:id/attachments` — agregar adjunto
- `DELETE /reports/:id/attachments/:attachmentId` — quitar adjunto

#### Scenario: Adjuntar documento
- **WHEN** se adjunta un documento previamente subido por `/uploads/document`
- **THEN** aparece en el detalle del informe

### Requirement: Report PDF

El sistema SHALL permitir descargar un informe en PDF.

- `GET /reports/:id/pdf` — descarga PDF

#### Scenario: Descarga
- **WHEN** se solicita el PDF de un informe existente
- **THEN** el sistema responde con un PDF que incluye el título, el niño y el contenido

### Requirement: Report Visibility

El sistema SHALL marcar con `visibilityToParents` los informes que pueden
publicarse en el portal público. Por defecto es `false`; solo un informe con
`isDraft` en `false` **y** `visibilityToParents` en `true` se publica.

#### Scenario: Informe visible
- **WHEN** un informe tiene `isDraft` en `false` y `visibilityToParents` en `true`
- **THEN** el portal público lo incluye

#### Scenario: Borrador no visible
- **WHEN** un informe es borrador (`isDraft` en `true`)
- **THEN** nunca se publica aunque `visibilityToParents` sea `true`

### Requirement: Reports RBAC

El acceso a los endpoints de informes SHALL cumplir la Permission Matrix de
`user-roles`.

| Operación | ADMIN | ESPECIALISTA | PERSONAL_ADMINISTRATIVO |
| --- | --- | --- | --- |
| Informes, adjuntos y PDF | CRUD | CRUD (niños asignados) | 403 |

#### Scenario: Especialista fuera de sus niños
- **WHEN** un especialista crea o consulta un informe de un niño no asignado
- **THEN** el sistema devuelve 403

#### Scenario: Personal sin acceso
- **WHEN** un `PERSONAL_ADMINISTRATIVO` llama a `/reports`
- **THEN** el sistema devuelve 403
