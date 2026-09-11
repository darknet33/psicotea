## ADDED Requirements

### Requirement: Child Registration

El sistema SHALL permitir registrar un niño con sus datos personales y los datos de su padre/madre/tutor embebidos en el mismo registro (no como usuario del sistema).

Datos del niño:

- `name`, `lastName`, `dateOfBirth`, `sex`, `photo` (opcional), `enrollmentDate`, `isActive`

Datos del tutor (embebidos en `Child`):

- `parentName`, `parentLastName`, `parentRelationship` (Madre/Padre/Tutor...), `parentPhone`, `parentEmail` (opcional), `parentCarnet` (documento de identidad)

#### Scenario: Registro exitoso
- **WHEN** un usuario con permiso registra un niño con sus datos y los del tutor
- **THEN** el sistema crea el registro con los campos embebidos del tutor y devuelve 201 con el niño creado

#### Scenario: El tutor no es un usuario
- **WHEN** se registra un niño con datos de tutor
- **THEN** no se crea ninguna cuenta `User` para el tutor y `parentCarnet` se guarda como dato del niño

### Requirement: Child CRUD

El sistema SHALL permitir crear, listar, obtener, actualizar y eliminar niños mediante endpoints protegidos por JWT y rol.

- `GET /children` — lista (paginas/filtrables)
- `GET /children/:id` — detalle/expediente
- `POST /children` — crear
- `PATCH /children/:id` — actualizar
- `DELETE /children/:id` — eliminar (soft o hard, segun politca del modulo)

#### Scenario: CRUD de ADMIN
- **WHEN** un ADMIN llama a cualquier endpoint CRUD de niños
- **THEN** la operación se ejecuta y devuelve el resultado (200/201) o 403 no aplica (ADMIN tiene acceso total)

#### Scenario: CRUD de personal administrativo
- **WHEN** un PERSONAL_ADMINISTRATIVO llama a cualquier endpoint CRUD de niños
- **THEN** la operación se ejecuta normalmente

#### Scenario: Especialista sin acceso a lista global
- **WHEN** un ESPECIALISTA llama a `GET /children`
- **THEN** solo recibe los niños asignados a él (ver Requirement: Assigned Children)

#### Scenario: Especialista sin permiso de alta
- **WHEN** un ESPECIALISTA llama a `POST /children`
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: Assigned Children

El sistema SHALL permitir a un especialista consultar únicamente los niños que le han sido asignados a traves de `GET /children` (filtrado por `specialistId`) o un endpoint dedicado, sin acceso a la lista global.

#### Scenario: Lista filtrada para especialista
- **WHEN** un ESPECIALISTA lista niños
- **THEN** el sistema filtra por su `specialistId` y solo devuelve los asignados

#### Scenario: Sin asignaciones
- **WHEN** un ESPECIALISTA no tiene niños asignados
- **THEN** la lista devuelta es vacia

### Requirement: Child Search and Filters

El sistema SHALL permitir buscar niños por nombre/apellido (case-insensitive) y filtrar por estado (`isActive`) y por especialista asignado.

#### Scenario: Busqueda por nombre
- **WHEN** se busca por texto en `name` o `lastName`
- **THEN** el sistema devuelve los niños que coinciden parcialmente, sin distinguir mayusculas/minusculas

#### Scenario: Filtro por estado
- **WHEN** se filtra por `isActive`
- **THEN** el sistema devuelve solo los niños activos o inactivos segun el filtro

### Requirement: Specialist Assignment

El sistema SHALL permitir asignar o reasignar un especialista a un niño mediante el campo `specialistId` en la actualizacion, validando que el especialista exista y este activo.

#### Scenario: Asignacion valida
- **WHEN** se actualiza un niño con un `specialistId` existente y activo
- **THEN** el niño queda asignado a ese especialista

#### Scenario: Especialista inexistente
- **WHEN** se intenta asignar un `specialistId` que no existe
- **THEN** el sistema devuelve 400/404 con un error de validacion

### Requirement: Child RBAC

El acceso a los endpoints de niños SHALL cumplir la Permission Matrix de `user-roles`:

| Módulo | ADMIN | ESPECIALISTA | PERSONAL_ADMINISTRATIVO |
|--------|-------|--------------|------------------------|
| Niños | CRUD | Read (asignados) | CRUD |

#### Scenario: Matriz de permisos aplicada
- **WHEN** un rol intenta operar sobre niños
- **THEN** el resultado corresponde a la celda de la Permission Matrix (CRUD, Read-asignados o 403)