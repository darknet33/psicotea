## ADDED Requirements

### Requirement: Activity Management

El sistema SHALL permitir registrar y consultar las actividades diarias
(`Activity`) con `childId`, `date`, `title`, `description` (opcional),
`duration` (opcional, minutos) y el responsable (`specialistId`).

- `GET /activities` — listado con filtros
- `GET /activities/:id` — detalle
- `POST /activities` — alta
- `PATCH /activities/:id` — edición
- `DELETE /activities/:id` — baja

#### Scenario: Registrar actividad
- **WHEN** un responsable registra una actividad con niño, fecha y título
- **THEN** el sistema la crea y guarda al responsable

#### Scenario: Niño inexistente
- **WHEN** se registra una actividad para un niño que no existe
- **THEN** el sistema responde `404`

### Requirement: Activity Ownership

El sistema SHALL asignar la actividad al usuario autenticado cuando su rol sea
`ESPECIALISTA`, y SHALL permitir al `ADMIN` indicar el responsable.

#### Scenario: Especialista registra
- **WHEN** un `ESPECIALISTA` crea una actividad
- **THEN** el responsable queda registrado como el propio especialista

### Requirement: Activity Access Control

El sistema SHALL permitir gestionar actividades a los roles `ADMIN`,
`ESPECIALISTA` y `PERSONAL_ADMINISTRATIVO`.

#### Scenario: Acceso denegado
- **WHEN** un usuario sin sesión llama a `GET /activities`
- **THEN** el sistema responde `401`

### Requirement: Activity Filters and History

El sistema SHALL permitir filtrar actividades por niño, responsable, rango de
fechas y texto, de modo que sirvan como historial del niño.

- `GET /activities?childId=&specialistId=&from=&to=&search=`

#### Scenario: Historial del niño
- **WHEN** se consulta `GET /activities?childId=5` ordenado por fecha
- **THEN** el sistema devuelve las actividades de ese niño para su expediente

#### Scenario: Filtrar por fecha
- **WHEN** se consulta `GET /activities` con `from` y `to`
- **THEN** solo se devuelven las actividades dentro del rango

### Requirement: Activity Page

El sistema SHALL ofrecer una página `/activities` para listar, filtrar y
registrar actividades.

#### Scenario: Ver y registrar
- **WHEN** un usuario autorizado abre `/activities`
- **THEN** ve la tabla de actividades con filtros por niño y fecha, y puede
  registrar o editar una actividad desde un formulario
