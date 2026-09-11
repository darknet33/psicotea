## ADDED Requirements

### Requirement: Children List

El frontend SHALL mostrar un listado de ninos en `/children` con columnas de nombre/apellido, edad/sexo, tutor, estado (`isActive`) y acciones, consumiendo `GET /children` de la API. El listado SHALL incluir estados de carga (skeleton), vacio ("No hay ninos registrados") y error (con reintentar).

#### Scenario: Listado cargado
- **WHEN** un usuario con permiso abre `/children`
- **THEN** se muestran los ninos devueltos por `GET /children` en una tabla

#### Scenario: Sin resultados
- **WHEN** la API devuelve una lista vacia o un filtro no encuentra coincidencias
- **THEN** la tabla muestra el estado vacio con un mensaje claro

#### Scenario: Error de red
- **WHEN** `GET /children` falla
- **THEN** se muestra un mensaje de error y una accion "Reintentar"

### Requirement: Children Search and Filters

El listado SHALL permitir buscar por texto (nombre/apellido, case-insensitive) y filtrar por estado (`isActive` y, en el caso ADMIN/PERSONAL, por especialista, si la API lo soporta). Los filtros SHALL reflejarse como query params de `GET /children` sin recargar la pagina.

#### Scenario: Busqueda por texto
- **WHEN** el usuario escribe en el campo de busqueda y presiona Enter o se debouncea
- **THEN** se consulta `GET /children?search=...` y se muestran los resultados coincidentes

#### Scenario: Filtro por estado
- **WHEN** el usuario cambia el filtro de estado activo/inactivo
- **THEN** se consulta `GET /children?isActive=...` y se actualiza la tabla

### Requirement: Child Create and Edit Form

El frontend SHALL ofrecer un formulario para dar de alta (`/children/new`) y editar un nino, con todos los campos del `CreateChildDto`/`UpdateChildDto`: datos del nino (`name`, `lastName`, `dateOfBirth`, `sex`, `enrollmentDate`, `isActive`) y datos del tutor embebidos (`parentName`, `parentLastName`, `parentRelationship`, `parentPhone`, `parentEmail` opcional, `parentCarnet`), ademas de `specialistId` opcional. La validacion SHALL usar zod con reglas equivalentes a las del backend.

#### Scenario: Alta exitosa
- **WHEN** el usuario completa el formulario valido y envia
- **THEN** se llama a `POST /children` y se navega al expediente del nino creado (con toast de exito)

#### Scenario: Validacion fallida
- **WHEN** el formulario no cumple las reglas (p. ej. falta el teléfono del tutor)
- **THEN** se muestran mensajes de error bajo cada campo y no se envia

#### Scenario: Edicion exitosa
- **WHEN** el usuario edita un nino existente y envia
- **THEN** se llama a `PATCH /children/:id` y se actualiza el expediente (con toast de exito)

### Requirement: Child Detail (Expediente)

El frontend SHALL mostrar el expediente de un nino en `/children/[id]` con sus datos personales, del tutor, inscripciones (`GET /enrollments/child/:childId`) e historial de pagos (`GET /payments/child/:childId`), debidamente separados por secciones.

#### Scenario: Expediente del nino
- **WHEN** un usuario autorizado abre `/children/[id]`
- **THEN** se muestran datos del nino, tutor, inscripciones e historial de pagos

#### Scenario: Acciones segun rol
- **WHEN** el usuario es ADMIN/PERSONAL_ADMINISTRATIVO
- **THEN** el expediente muestra botones de editar y eliminar

### Requirement: Children RBAC (frontend)

La seccion "Ninos" SHALL estar disponible para ADMIN y PERSONAL_ADMINISTRATIVO (lectura y escritura) y para ESPECIALISTA en modo SOLO LECTURA, mostrando unicamente sus ninos asignados. El sidebar SHALL mostrar `Ninos` a los tres roles; para ESPECIALISTA se ocultan las acciones de crear, editar y eliminar.

#### Scenario: Especialista solo lectura
- **WHEN** un ESPECIALISTA abre `/children`
- **THEN** ve la lista (solo asignados) sin botones de alta/edicion/eliminacion

#### Scenario: Sin asignaciones
- **WHEN** un ESPECIALISTA no tiene ninos asignados
- **THEN** la lista muestra el estado vacio sin mostrar acciones de creacion

#### Scenario: Acciones ocultas para personal sin permiso
- **WHEN** el rol del usuario no tiene permiso de escritura sobre ninos
- **THEN** las acciones correspondientes no se renderizan en la UI (ademas del 403 del backend como respaldo)