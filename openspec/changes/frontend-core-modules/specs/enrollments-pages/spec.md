## ADDED Requirements

### Requirement: Enrollments List

El frontend SHALL mostrar el listado de inscripciones en `/enrollments` con columnas de nino, fechas (`startDate`/`endDate`), matricula mensual, estado y acciones, consumiendo `GET /enrollments`. SHALL incluir filtro por estado y estados de carga/vacio/error.

#### Scenario: Listado cargado
- **WHEN** un usuario con permiso abre `/enrollments`
- **THEN** se muestran las inscripciones en una tabla con su estado como badge

#### Scenario: Filtro por estado
- **WHEN** el usuario filtra por estado (ACTIVO/INACTIVO/RETIRADO)
- **THEN** la tabla muestra solo las inscripciones de ese estado

### Requirement: Enrollment Creation

El frontend SHALL ofrecer un formulario de inscripcion con nino (selector), `startDate`, `monthlyFee` (obligatoria) y `notes` (opcional), validado con zod. Al enviar se llama a `POST /enrollments` y se refresca el listado.

#### Scenario: Inscripcion exitosa
- **WHEN** el usuario completa el formulario valido y envia
- **THEN** se crea la inscripcion (201) y el listado se refresca con toast de exito

#### Scenario: Matricula requerida
- **WHEN** `monthlyFee` no se ingresa o es <= 0
- **THEN** el formulario muestra error y no se envia

### Requirement: Enrollments Status Change

La UI SHALL permitir cambiar el estado de una inscripcion (ACTIVO/INACTIVO/RETIRADO) mediante `PATCH /enrollments/:id` con confirmacion previa, mostrando el `endDate` asignado automaticamente cuando el estado deja de ser ACTIVO.

#### Scenario: Cambio de estado
- **WHEN** el usuario cambia el estado de una inscripcion y confirma
- **THEN** se actualiza el estado y el listado refleja el nuevo badge (con toast)

#### Scenario: Cancelacion de la confirmacion
- **WHEN** el usuario cancela la confirmacion de cambio de estado
- **THEN** no se llama a la API y el estado permanece

### Requirement: Enrollment RBAC (frontend)

Las pantallas de inscripciones SHALL estar visibles solo para ADMIN y PERSONAL_ADMINISTRATIVO; el sidebar no SHALL mostrar "Inscripciones" al ESPECIALISTA.

#### Scenario: Acceso por rol
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO abre `/enrollments`
- **THEN** ve el listado y puede crear y cambiar estados

#### Scenario: Sin acceso
- **WHEN** un ESPECIALISTA abre `/enrollments`
- **THEN** el backend devuelve 403 y la pagina muestra el error (el item no aparece en su sidebar)