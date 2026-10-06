## ADDED Requirements

### Requirement: Area Catalog

El sistema SHALL mantener un catálogo de áreas de trabajo del centro. Cada área SHALL tener `name` (obligatorio y único en el sistema, con comparación insensible a mayúsculas) y `description` (opcional). El catálogo SHALL admitir desactivar un área sin borrarla, mediante `isActive`, para no perder la referencia de las inscripciones que ya la usan.

Las áreas SHALL ser opcionales en el modelo: una inscripción puede no tener ninguna área asociada.

- `GET /areas` — listado de áreas, solo activas por defecto
- `GET /areas` con `?includeInactive=true` — listado completo
- `GET /areas/:id` — detalle

#### Scenario: Listado de áreas activas
- **WHEN** un usuario con permiso consulta `GET /areas` sin parámetros
- **THEN** el sistema devuelve únicamente las áreas con `isActive` en `true`, ordenadas alfabéticamente por `name`

#### Scenario: Listado incluyendo inactivas
- **WHEN** un usuario consulta `GET /areas?includeInactive=true`
- **THEN** el sistema devuelve todas las áreas, activas e inactivas

#### Scenario: Nombre duplicado
- **WHEN** se crea un área con un `name` que ya existe en el catálogo
- **THEN** el sistema rechaza la operación con 400 indicando que el nombre ya está en uso

#### Scenario: Nombre en blanco
- **WHEN** se crea un área sin `name` o con `name` en blanco
- **THEN** el sistema la rechaza con 400 por error de validación

#### Scenario: Área inexistente
- **WHEN** se consulta `GET /areas/:id` con un id que no existe
- **THEN** el sistema devuelve 404

### Requirement: Area Management

El sistema SHALL permitir al ADMIN crear y editar áreas. La edición SHALL admitir cambiar `name`, `description` y `isActive`.

- `POST /areas` — crear
- `PATCH /areas/:id` — editar (incluye activar/desactivar)

No SHALL existir borrado físico de un área: la desactivación cubre el caso sin romper el historial de las inscripciones que la referencian.

#### Scenario: Alta de área
- **WHEN** un ADMIN crea un área con `name` y opcionalmente `description`
- **THEN** el sistema la crea con `isActive` en `true` y devuelve 201 con el área creada

#### Scenario: Edición de área
- **WHEN** un ADMIN edita el `name` o la `description` de un área
- **THEN** el sistema guarda los cambios y devuelve el área actualizada

#### Scenario: Desactivación
- **WHEN** un ADMIN envía `PATCH /areas/:id` con `isActive: false`
- **THEN** el área queda inactiva, desaparece del listado por defecto y sus inscriptions existentes la conservan

#### Scenario: Reactivación
- **WHEN** un ADMIN vuelve a activar un área inactiva con `isActive: true`
- **THEN** el área reaparece en el listado por defecto

#### Scenario: No se puede reutilizar el nombre de un área inactiva
- **WHEN** se crea un área con el `name` de una área existente que está inactiva
- **THEN** el sistema rechaza la operación con 400, porque el `name` es único sobre todo el catálogo, no solo entre las activas

### Requirement: Area RBAC

El acceso a los endpoints de áreas SHALL cumplir la Permission Matrix de `user-roles`.

| Operación | ADMIN | PERSONAL_ADMINISTRATIVO | ESPECIALISTA |
| --- | --- | --- | --- |
| `GET /areas`, `GET /areas/:id` | permitido | permitido | 403 |
| `POST /areas`, `PATCH /areas/:id` | permitido | 403 | 403 |

El `GET` queda abierto a los mismos roles que ya gestionan inscripciones porque el formulario de inscripción necesita listar el catálogo; la escritura se reserva al ADMIN para no fragmentar el catálogo entre varias personas.

#### Scenario: Listado por rol
- **WHEN** un ADMIN o un PERSONAL_ADMINISTRATIVO consulta `GET /areas`
- **THEN** la operación se ejecuta normalmente

#### Scenario: Escritura restringida al ADMIN
- **WHEN** un PERSONAL_ADMINISTRATIVO o un ESPECIALISTA intenta crear o editar un área
- **THEN** el sistema devuelve 403 Forbidden

#### Scenario: Sin acceso de lectura para el ESPECIALISTA
- **WHEN** un ESPECIALISTA consulta `GET /areas`
- **THEN** el sistema devuelve 403 Forbidden

#### Scenario: Acceso sin token
- **WHEN** se consulta `GET /areas` sin un JWT válido
- **THEN** el sistema devuelve 401 Unauthorized

### Requirement: Areas Page

El frontend SHALL ofrecer una página de administración de áreas en `/areas`, visible en el sidebar únicamente para el ADMIN. La página SHALL permitir listar, crear, editar y activar/desactivar áreas, con estados de carga, vacío y error.

Las áreas inactivas SHALL mostrarse distinguidas de las activas, y por defecto la vista SHALL listar todas para que el ADMIN vea el catálogo completo y pueda reactivar.

#### Scenario: Catálogo cargado
- **WHEN** un ADMIN abre `/areas`
- **THEN** se listan las áreas en una tabla con nombre, descripción y estado, con las inactivas atenuadas

#### Scenario: Sin áreas
- **WHEN** el catálogo está vacío
- **THEN** la página muestra el estado vacío con la acción de crear la primera área

#### Scenario: Alta o edición
- **WHEN** el ADMIN completa el formulario de área y envía
- **THEN** el área se crea o actualiza y la tabla se refresca con un toast de éxito

#### Scenario: Nombre duplicado
- **WHEN** el ADMIN intenta guardar un área con un nombre ya usado
- **THEN** el formulario muestra el mensaje de error devuelto por la API y no refresca la tabla

#### Scenario: Cambio de estado
- **WHEN** el ADMIN activa o desactiva un área desde la tabla
- **THEN** el estado cambia y la tabla se refresca

#### Scenario: El ESPECIALISTA no ve la página
- **WHEN** un ESPECIALISTA navega a `/areas`
- **THEN** el backend devuelve 403 y la página muestra el error; el item tampoco aparece en su sidebar
