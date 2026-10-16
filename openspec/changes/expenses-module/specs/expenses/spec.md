## ADDED Requirements

### Requirement: Expense Category Management

El sistema SHALL permitir administrar las categorías de gasto (`Category`),
con `name` (único), `description` (opcional), `color` (opcional) e `isActive`.

- `GET /expenses/categories` — listado (activas por defecto, `?includeInactive=true`)
- `POST /expenses/categories` — alta
- `PATCH /expenses/categories/:id` — edición y activar/desactivar

#### Scenario: Crear categoría
- **WHEN** un usuario autorizado crea una categoría con un nombre no repetido
- **THEN** el sistema la devuelve disponible para clasificar gastos

#### Scenario: Categoría duplicada
- **WHEN** se intenta crear una categoría con un nombre ya existente
- **THEN** el sistema responde `400` indicando que ya existe

### Requirement: Expense Management

El sistema SHALL permitir registrar y consultar gastos (`Expense`) con
`categoryId`, `amount`, `date`, `description` (opcional) y `receiptUrl`
(opcional), registrando el usuario creador.

- `GET /expenses` — listado con filtros
- `GET /expenses/:id` — detalle
- `POST /expenses` — alta
- `PATCH /expenses/:id` — edición

#### Scenario: Registrar gasto
- **WHEN** un usuario autorizado registra un gasto con categoría, monto y fecha
- **THEN** el sistema lo crea y guarda el usuario que lo registró

#### Scenario: Categoría inexistente
- **WHEN** se registra un gasto con una categoría que no existe
- **THEN** el sistema responde `404`

### Requirement: Expense Filters and Totals

El sistema SHALL permitir filtrar gastos por categoría, rango de fechas,
responsable y texto libre, y SHALL exponer totales del período, del día y por
categoría.

- `GET /expenses?categoryId=&from=&to=&createdById=&search=`
- `GET /expenses/totals` — `{ periodTotal, todayTotal, byCategory[] }`

#### Scenario: Filtrar gastos
- **WHEN** se consulta `GET /expenses` con `from`, `to` y `categoryId`
- **THEN** solo se devuelven los gastos que cumplen el rango y la categoría

#### Scenario: Totales
- **WHEN** se consulta `GET /expenses/totals` con un rango de fechas
- **THEN** el sistema devuelve el total del período, el total del día y los
  subtotales por categoría

### Requirement: Expense Access Control

El sistema SHALL permitir gestionar gastos y categorías a los roles `ADMIN` y
`PERSONAL_ADMINISTRATIVO`.

#### Scenario: Acceso denegado
- **WHEN** un usuario con rol `ESPECIALISTA` llama a `GET /expenses`
- **THEN** el sistema responde `403`

### Requirement: Expense Pages

El sistema SHALL ofrecer `/expenses` (listado, filtros, totales y alta/edición)
y `/expenses/categories` (catálogo de categorías).

#### Scenario: Ver totales y filtros
- **WHEN** un usuario autorizado abre `/expenses`
- **THEN** ve el total del período, el del día y la tabla de gastos, pudiendo
  filtrar por categoría y fechas
