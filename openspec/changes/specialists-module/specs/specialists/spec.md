## ADDED Requirements

### Requirement: Specialist Management

El sistema SHALL permitir gestionar especialistas, cada uno asociado a un `User`
con rol `ESPECIALISTA`. Cada especialista SHALL tener `professionalId` (único),
`specialty`, `licenseNumber` (opcional), `phone`, `address`, `entryDate` (fecha
de ingreso), `monthlySalary` (opcional) e `isActive`.

- `GET /specialists` — listado (solo activos por defecto, `?includeInactive=true`)
- `GET /specialists/:id` — detalle con horarios, áreas, niños y pagos
- `POST /specialists` — crear
- `PATCH /specialists/:id` — editar (incluye activar/desactivar)

#### Scenario: Alta de especialista
- **WHEN** un ADMIN crea un especialista con un `userId` válido, `professionalId` único, especialidad y fecha de ingreso
- **THEN** el sistema devuelve 201 con el especialista creado

#### Scenario: Usuario ya es especialista
- **WHEN** se intenta crear un especialista con un `userId` que ya tiene perfil de especialista
- **THEN** el sistema devuelve 400 indicando que ese usuario ya está asociado

#### Scenario: `professionalId` duplicado
- **WHEN** se crea un especialista con un `professionalId` ya usado
- **THEN** el sistema devuelve 400

#### Scenario: Especialista inexistente
- **WHEN** se consulta o edita un especialista con un id que no existe
- **THEN** el sistema devuelve 404

### Requirement: Specialist Schedule

El sistema SHALL permitir definir, por especialista y día de la semana, un turno
(`MANANA`, `TARDE` o `AMBOS`) o un horario personalizado con hora de inicio y fin.
Debe existir como máximo una entrada por especialista y día.

- `GET /specialists/:id/schedule` — horario semanal
- `PUT /specialists/:id/schedule` — reemplaza el horario completo

#### Scenario: Horario por turno
- **WHEN** el ADMIN define el lunes con turno `MANANA`
- **THEN** el sistema guarda la entrada con ese turno y sin horas personalizadas

#### Scenario: Horario personalizado
- **WHEN** el ADMIN define un día con `startTime` y `endTime`
- **THEN** el sistema guarda la entrada con esas horas

#### Scenario: Un solo registro por día
- **WHEN** se define dos veces el mismo día para un especialista
- **THEN** el sistema conserva una única entrada para ese día

### Requirement: Specialist Areas

El sistema SHALL permitir asociar una o varias áreas del catálogo a cada
especialista.

- `PUT /specialists/:id/areas` — reemplaza las áreas del especialista por la lista enviada

#### Scenario: Asociación de áreas
- **WHEN** el ADMIN envía una lista de `areaId` para un especialista
- **THEN** el especialista queda asociado exactamente a esas áreas

#### Scenario: Área inexistente
- **WHEN** la lista incluye un `areaId` que no existe
- **THEN** el sistema devuelve 400

### Requirement: Specialist Children Assignment

El sistema SHALL permitir asignar o reasignar los niños que atiende un
especialista usando el campo `Child.specialistId`.

- `PATCH /specialists/:id/children` — reemplaza los niños asignados por la lista enviada

#### Scenario: Reasignación
- **WHEN** el ADMIN envía la lista de niños de un especialista
- **THEN** los niños no incluidos quedan sin ese especialista y los incluidos quedan asignados a él

### Requirement: Specialist Payments

El sistema SHALL permitir registrar pagos/sueldo al especialista. Cada pago
SHALL tener `amount`, `periodStart`, `periodEnd`, `paymentDate`, `method`
(`EFECTIVO`, `QR`, `TRANSFERENCIA`) y `notes` opcional. El sistema SHALL ofrecer
la generación de períodos mensuales a partir de `entryDate`.

- `GET /specialists/:id/payments` — historial de pagos
- `POST /specialists/:id/payments` — registrar pago
- `DELETE /specialists/:id/payments/:paymentId` — anular pago

#### Scenario: Registrar pago
- **WHEN** el ADMIN registra un pago para un especialista con monto y período válidos
- **THEN** el sistema lo crea y aparece en el historial

#### Scenario: Monto inválido
- **WHEN** se registra un pago con monto menor o igual a cero
- **THEN** el sistema devuelve 400

### Requirement: Specialist RBAC

El acceso a los endpoints de especialistas SHALL cumplir la Permission Matrix de
`user-roles`.

| Operación | ADMIN | PERSONAL_ADMINISTRATIVO | ESPECIALISTA |
| --- | --- | --- | --- |
| `GET /specialists`, `GET /specialists/:id` | permitido | permitido | 403 |
| `POST/PATCH/DELETE /specialists`, horarios, áreas, niños y pagos | permitido | 403 | 403 |

#### Scenario: Escritura restringida al ADMIN
- **WHEN** un `PERSONAL_ADMINISTRATIVO` o un `ESPECIALISTA` intenta crear o editar un especialista
- **THEN** el sistema devuelve 403

### Requirement: Specialists Page

El frontend SHALL ofrecer una página `/specialists` visible en el sidebar
únicamente para ADMIN, con listado, formulario de alta/edición, editor de
horarios, selector de áreas, asignación de niños y pestaña de pagos.

#### Scenario: Especialista creado
- **WHEN** el ADMIN completa el formulario y guarda
- **THEN** el especialista aparece en la tabla

#### Scenario: Sin especialistas
- **WHEN** no hay especialistas registrados
- **THEN** la página muestra el estado vacío con la acción de crear el primero
