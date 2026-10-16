## ADDED Requirements

### Requirement: Treatment Plans

El sistema SHALL permitir a un especialista mantener planes de tratamiento para
los niños asignados. Cada plan SHALL tener `childId`, `specialistId`, `areaId`
opcional, `frequency` (`DAILY` o `WEEKLY`), `startDate`, `endDate` opcional,
`notes` opcional y `isActive`.

- `GET /planning/plans?childId=&specialistId=` — listado
- `POST /planning/plans` — crear
- `PATCH /planning/plans/:id` — editar
- `DELETE /planning/plans/:id` — desactivar

#### Scenario: Crear plan
- **WHEN** un especialista crea un plan para un niño asignado con frecuencia y fecha de inicio
- **THEN** el sistema devuelve 201 con el plan creado

#### Scenario: Niño no asignado
- **WHEN** un especialista intenta crear un plan para un niño que no le está asignado
- **THEN** el sistema devuelve 403

### Requirement: Treatment Plan Items

El sistema SHALL permitir definir los ítems de un plan, cada uno con `title`,
`description` opcional, `dayOfWeek` opcional (0–6) y `order`.

- `GET /planning/plans/:id/items` — ítems del plan
- `POST /planning/plans/:id/items` — agregar ítem
- `PATCH /planning/plans/:id/items/:itemId` — editar ítem
- `DELETE /planning/plans/:id/items/:itemId` — quitar ítem

#### Scenario: Ítem con día
- **WHEN** se agrega un ítem con `dayOfWeek` 2
- **THEN** el ítem aparece en la planificación de los martes

#### Scenario: Ítem sin día
- **WHEN** se agrega un ítem sin `dayOfWeek`
- **THEN** el ítem aparece en todos los días del plan

### Requirement: Specialist Planning View

El sistema SHALL ofrecer al especialista una vista de su planificación por día o
semana, mostrando los ítems vigentes de sus planes para los niños asignados.

- `GET /planning/agenda?date=YYYY-MM-DD` — ítems del día
- `GET /planning/agenda?from=&to=` — ítems del rango (semana)

#### Scenario: Agenda del día
- **WHEN** un especialista consulta la agenda de una fecha
- **THEN** recibe los ítems de planes vigentes que apliquen a ese día

#### Scenario: Solo sus niños
- **WHEN** un especialista consulta la agenda
- **THEN** solo ve ítems de niños que le están asignados

### Requirement: Evolution Notes

El sistema SHALL permitir registrar notas de evolución de un especialista sobre
un niño, con `date`, `content`, `observation` opcional y `planItemId` opcional.

- `GET /planning/evolution?childId=` — notas del niño
- `POST /planning/evolution` — registrar nota
- `PATCH /planning/evolution/:id` — editar nota
- `DELETE /planning/evolution/:id` — eliminar nota

#### Scenario: Registrar nota
- **WHEN** un especialista registra una nota de evolución para un niño asignado
- **THEN** el sistema la crea con la fecha indicada

#### Scenario: Nota con observación
- **WHEN** se registra una nota con `observation`
- **THEN** la observación se guarda y se muestra junto al contenido

#### Scenario: Nota sin contenido
- **WHEN** se registra una nota sin `content`
- **THEN** el sistema devuelve 400

### Requirement: Treatment Planning RBAC

El acceso a los endpoints de planificación SHALL cumplir la Permission Matrix de
`user-roles`.

| Operación | ADMIN | ESPECIALISTA | PERSONAL_ADMINISTRATIVO |
| --- | --- | --- | --- |
| Planes, ítems y notas de evolución | CRUD | CRUD (niños asignados) | 403 |

#### Scenario: Especialista fuera de sus niños
- **WHEN** un especialista opera sobre un plan o nota de un niño no asignado
- **THEN** el sistema devuelve 403

#### Scenario: Personal sin acceso
- **WHEN** un `PERSONAL_ADMINISTRATIVO` llama a un endpoint de planificación
- **THEN** el sistema devuelve 403
