## MODIFIED Requirements

### Requirement: Public Child Lookup

El sistema SHALL exponer un endpoint público sin autenticación que, dado un
`credentialCode` válido, devuelva el perfil del niño y su historial para consulta
de los padres, **sin requerir cuenta ni validación adicional**.

El DTO de respuesta SHALL incluir:

- `name`, `lastName`, `carnet`, `age`, `photoUrl` y `diagnostico` del niño.
- `primaryTutor` con `name`, `lastName`, `relationship`, `phone` y `address`.
- `enrollments` con `type`, `startDate`, `endDate`, `status`, `amount`, `totalPaid`
  y `balance`.
- `attendances` con `date` y `status` (historial completo).
- `activities` con `date`, `title` y `description`.
- `reports` con `title`, `type`, `reportPeriod`, `periodStart`, `periodEnd`
  y `content`, para los informes con `isDraft` en `false` y
  `visibilityToParents` en `true`.

El endpoint SHALL aplicar limitación de tasa.

#### Scenario: Consulta válida
- **WHEN** un padre abre la URL pública con un `credentialCode` válido
- **THEN** el sistema responde 200 con los datos del niño (incluido el diagnóstico), sus inscripciones, asistencias, actividades e informes visibles

#### Scenario: Token inválido
- **WHEN** se solicita el endpoint con un `credentialCode` inexistente o con firma inválida
- **THEN** el sistema responde 404 con un mensaje genérico

#### Scenario: Niño no activo
- **WHEN** se consulta la página pública de un niño con `isActive` en false
- **THEN** el sistema responde 404

#### Scenario: Diagnóstico expuesto por decisión del dueño
- **WHEN** un padre consulta la página pública de un niño
- **THEN** la respuesta incluye el `diagnostico`, porque el dueño aceptó exponerlo con el QR

#### Scenario: Informe no visible
- **WHEN** un informe es borrador o tiene `visibilityToParents` en false
- **THEN** no aparece en la respuesta pública

#### Scenario: Limite de peticiones
- **WHEN** un mismo origen supera el límite de peticiones al endpoint público
- **THEN** el sistema responde 429

## ADDED Requirements

### Requirement: Public Summary PDF

El sistema SHALL permitir descargar un PDF resumido del historial del niño desde
el portal público.

- `GET /public/children/credential/:code/summary.pdf` — PDF resumido

#### Scenario: Descarga de resumen
- **WHEN** un padre solicita el resumen PDF con un `credentialCode` válido
- **THEN** el sistema responde con un PDF que incluye los datos del niño, sus inscripciones, asistencias, actividades e informes visibles

#### Scenario: Token inválido en PDF
- **WHEN** se solicita el PDF con un `credentialCode` inválido
- **THEN** el sistema responde 404

### Requirement: Public Child Page Sections

La página pública `/publico/nino/[code]` SHALL mostrar las secciones de datos,
diagnóstico, inscripciones, asistencias, actividades e informes, y un botón para
descargar el PDF resumido.

#### Scenario: Página completa
- **WHEN** un padre abre la página pública
- **THEN** ve el historial por secciones y puede descargar el resumen PDF
