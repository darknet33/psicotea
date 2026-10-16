## ADDED Requirements

### Requirement: Staff Management

El sistema SHALL permitir gestionar al personal del centro (`Staff`), cada uno
asociado a un `User`. Cada registro SHALL tener `employeeId` (único),
`position`, `department` (opcional), `hireDate`, `salary` (opcional), `phone`
(opcional), `address` (opcional) e `isActive`.

- `GET /staff` — listado (solo activos por defecto, `?includeInactive=true`, `?search=`)
- `GET /staff/:id` — detalle
- `POST /staff` — alta
- `PATCH /staff/:id` — edición y activar/desactivar

#### Scenario: Alta de personal
- **WHEN** un `ADMIN` registra un miembro del personal con un `userId` válido y
  un `employeeId` único
- **THEN** el sistema crea el registro y lo devuelve asociado a su usuario

#### Scenario: Usuario ya vinculado
- **WHEN** se intenta crear un `Staff` para un `User` que ya tiene ficha de personal
- **THEN** el sistema responde `400` con un mensaje explicativo

#### Scenario: Empleado inactivo
- **WHEN** se desactiva un miembro del personal
- **THEN** deja de aparecer en el listado por defecto y puede reactivarse con
  `includeInactive=true`

### Requirement: Staff Access Control

El sistema SHALL restringir la gestión del personal al rol `ADMIN`.

#### Scenario: Acceso denegado
- **WHEN** un usuario con rol `ESPECIALISTA` o `PERSONAL_ADMINISTRATIVO` llama a
  `GET /staff`
- **THEN** el sistema responde `403`

### Requirement: Staff Page

El sistema SHALL ofrecer una página `/staff` para que el `ADMIN` liste, cree,
edite y active/desactive miembros del personal.

#### Scenario: Listar y filtrar
- **WHEN** el `ADMIN` abre `/staff`
- **THEN** ve una tabla con nombre, cargo, departamento, fecha de ingreso y
  estado, con búsqueda por nombre/cargo y opción de mostrar inactivos

#### Scenario: Crear o editar
- **WHEN** el `ADMIN` usa el formulario de alta o edición
- **THEN** puede seleccionar el usuario asociado y completar los datos
  laborales, y la tabla se refresca al guardar
