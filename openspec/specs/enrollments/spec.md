# Enrollments Specification

## Purpose

Gestión de inscripciones de niños en Sistema_PsicoTea. Define creación de inscripciones, ciclo de vida de estado (`ACTIVO / INACTIVO / RETIRADO`), CRUD con filtros protegido por JWT y rol, y control de acceso.

## Requirements

### Requirement: Enrollment Creation

El sistema SHALL permitir crear una inscripcion (enrollment) para un nino activo, con `childId`, `startDate`, `endDate` (opcional), `status` (default `ACTIVO`), `monthlyFee` (matricula mensual) y `notes` (opcional).

#### Scenario: Inscripcion exitosa
- **WHEN** un usuario con permiso inscribe a un nino con sus datos
- **THEN** el sistema crea la inscripcion con estado `ACTIVO` y devuelve 201

#### Scenario: Nino inexistente
- **WHEN** se intenta inscribir a un `childId` que no existe
- **THEN** el sistema devuelve 404

#### Scenario: Matricula obligatoria
- **WHEN** no se envia `monthlyFee`
- **THEN** el sistema rechaza la inscripcion con error de validacion (400)

### Requirement: Enrollment Status Lifecycle

El sistema SHALL mantener el ciclo de vida de estado `ACTIVO / INACTIVO / RETIRADO` y permitir cambiarlo mediante actualizacion de la inscripcion, registrando `endDate` cuando el estado deja de ser `ACTIVO`.

#### Scenario: Cambio a RETIRADO
- **WHEN** se actualiza el estado de una inscripcion a `RETIRADO`
- **THEN** el sistema lo guarda y asigna `endDate` si no estaba definida

#### Scenario: Transiciones validas
- **WHEN** se cambia entre los estados permitidos
- **THEN** el sistema acepta la transicion y devuelve la inscripcion actualizada

#### Scenario: Listado por estado
- **WHEN** se consulta inscripciones filtrando por `status`
- **THEN** el sistema devuelve solo las de ese estado

### Requirement: Enrollment CRUD

El sistema SHALL permitir listar inscripciones (con filtros por `childId` y `status`), obtener una por id, crear y actualizar, mediante endpoints protegidos por JWT y rol.

- `GET /enrollments` — lista con filtros (`childId`, `status`)
- `GET /enrollments/:id` — detalle
- `GET /enrollments/child/:childId` — inscripciones de un nino
- `POST /enrollments` — crear
- `PATCH /enrollments/:id` — actualizar (incluye cambio de estado)

#### Scenario: Consulta por nino
- **WHEN** se consulta `GET /enrollments/child/:childId`
- **THEN** el sistema devuelve el historial de inscripciones de ese nino

### Requirement: Enrollment RBAC

El acceso a los endpoints de inscripciones SHALL cumplir la Permission Matrix de `user-roles` (CRUD para ADMIN y PERSONAL_ADMINISTRATIVO; sin acceso para ESPECIALISTA).

#### Scenario: Acceso permitido
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO opera sobre inscripciones
- **THEN** la operacion se ejecuta normalmente

#### Scenario: Acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta operar sobre inscripciones
- **THEN** el sistema devuelve 403 Forbidden