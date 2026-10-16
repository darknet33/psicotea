# Public Child Portal Specification

## Purpose

Portal público sin autenticación para que padres, madres o tutores consulten el historial de su niño validándose únicamente con la credencial del niño (código/QR). Expone el historial completo autorizado por decisión del dueño del centro y no constituye un registro de usuarios: los padres no inician sesión en el sistema.

## Requirements

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

### Requirement: Public Child Page

El frontend SHALL exponer una ruta pública `/publico/nino/[code]` accesible sin sesión iniciada, que consuma el endpoint público y presente los datos del niño.

La ruta SHALL quedar excluida del middleware de autenticación del frontend.

#### Scenario: Página sin sesión
- **WHEN** un padre abre `/publico/nino/{code}` sin haber iniciado sesión
- **THEN** la página se renderiza con los datos devueltos por el endpoint público

#### Scenario: Code inexistente
- **WHEN** se abre `/publico/nino/{code}` con un token inválido
- **THEN** la página muestra un estado de credencial no válida, sin error técnico

#### Scenario: Sin datos de tutor principal
- **WHEN** el niño no tiene tutor principal
- **THEN** la página omite la sección del tutor principal en lugar de fallar

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
diagnóstico, inscripciones, asistencias, actividades e informes, y un botón de
descarga del PDF resumido.

#### Scenario: Secciones visibles
- **WHEN** un padre abre la página pública con un `credentialCode` válido
- **THEN** ve las secciones de datos, diagnóstico, inscripciones (con saldos), asistencias, actividades e informes, y el botón "Descargar resumen PDF"

#### Scenario: Sin informes publicados
- **WHEN** el niño no tiene informes con `isDraft` en false y `visibilityToParents` en true
- **THEN** la sección de informes muestra un mensaje vacío en lugar de fallar
