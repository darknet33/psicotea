## MODIFIED Requirements

### Requirement: Payment Registration

El sistema SHALL permitir registrar un pago con:

- `childId` — niño al que pertenece el pago. Obligatorio.
- `amount` — monto recibido, mayor a cero. Obligatorio.
- `paymentDate` — fecha en que se recibió el dinero. Obligatoria.
- `method` — `EFECTIVO`, `QR` o `TRANSFERENCIA`. Obligatorio.
- `periodStart` / `periodEnd` — período al que corresponde el pago. Obligatorios.
- `enrollmentId` — inscripción destino opcional (caso de una sola obligación).
- `allocations` — lista opcional de `{ enrollmentId, amount }` para aplicar a varias obligaciones.
- `reference` / `description` — opcionales.

El registro del pago y la creación de sus `PaymentAllocation` SHALL ejecutarse en una **única transacción**. El sistema SHALL delegar la aplicación de allocations a la lógica definida en `payment-allocations`.

La fecha de pago y el período cubierto SHALL ser campos independientes y NO SHALL sincronizarse automáticamente.

#### Scenario: Registro de pago simple
- **WHEN** un usuario registra un pago con monto, fecha, método, período y una inscripción destino
- **THEN** el sistema guarda el pago y una allocation por el monto total a esa inscripción, y devuelve 201

#### Scenario: Registro de pago sin destino
- **WHEN** un usuario registra un pago sin indicar inscripción ni allocations
- **THEN** el sistema aplica el monto a la deuda más antigua del niño

#### Scenario: Método de pago inválido
- **WHEN** se intenta registrar un pago con un método fuera de `EFECTIVO | QR | TRANSFERENCIA`
- **THEN** el sistema rechaza el registro con 400

#### Scenario: Monto obligatorio
- **WHEN** se intenta registrar un pago con monto menor o igual a cero
- **THEN** el sistema rechaza el registro con 400

#### Scenario: Niño inexistente
- **WHEN** se registra un pago para un `childId` que no existe
- **THEN** el sistema devuelve 404

#### Scenario: Inscripción destino de otro niño
- **WHEN** se registra un pago con una inscripción que no pertenece al niño
- **THEN** el sistema rechaza el registro con 400

### Requirement: Payment Query

El sistema SHALL permitir consultar pagos por id, por niño, por periodo y listar todos, mediante endpoints protegidos.

- `GET /payments` — lista con filtros (`childId`, `periodStart`, `periodEnd`)
- `GET /payments/:id` — detalle
- `GET /payments/child/:childId` — historial de un niño, con las allocations de cada pago
- `GET /payments/period?start=&end=` — pagos de un periodo

Los pagos SHALL incluir sus `allocationes` y `enrollmentId` principal para que el cliente pueda mostrarlos agrupados por inscripción y período.

#### Scenario: Historial del niño
- **WHEN** se consulta `GET /payments/child/:childId`
- **THEN** el sistema devuelve el historial ordenado por fecha con la aplicación de cada pago

#### Scenario: Pagos por periodo
- **WHEN** se consulta `GET /payments/period` con `start` y `end`
- **THEN** el sistema devuelve los pagos cuyo período se intersecta con el consultado

### Requirement: Pending Payments

El sistema SHALL calcular las deudas separando las inscripciones anteriores de la inscripción vigente, a partir de los datos reales de cada inscripción y de sus allocations.

Para cada inscripción con saldo mayor a cero, el sistema SHALL informar el niño, la inscripción, el período de referencia y el saldo pendiente (`amount − Σ allocations`). El cálculo NO SHALL derivarse de multiplicar un monto mensual por una cantidad de meses.

#### Scenario: Inscripción con saldo pendiente
- **WHEN** una inscripción tiene `amount` Bs 800 y pagos aplicados por Bs 300
- **THEN** el sistema la reporta con saldo pendiente Bs 500

#### Scenario: Deuda anterior y deuda vigente separadas
- **WHEN** un niño tiene una inscripción anterior con saldo y una vigente también con saldo
- **THEN** el sistema las reporta por separado

#### Scenario: Sin deudas
- **WHEN** todas las inscripciones tienen saldo menor o igual a cero
- **THEN** el sistema no reporta deudas para ese niño

### Requirement: Payment RBAC

El acceso a los endpoints de pagos SHALL cumplir la Permission Matrix de `user-roles` (CRUD para ADMIN y PERSONAL_ADMINISTRATIVO; sin acceso para ESPECIALISTA).

#### Scenario: Acceso permitido
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO opera sobre pagos
- **THEN** la operación se ejecuta normalmente

#### Scenario: Acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta operar sobre pagos
- **THEN** el sistema devuelve 403 Forbidden

## ADDED Requirements

### Requirement: Payment Period vs Payment Date

El sistema SHALL distinguir explícitamente la **fecha de pago** (`paymentDate`, cuándo se recibió el dinero) del **período cubierto** (`periodStart`/`periodEnd`, a qué obligación corresponde).

El sistema NO SHALL cambiar automáticamente el período pagado al mes de la fecha de recepción del dinero. Un pago recibido en noviembre SHALL poder aplicarse a una deuda de octubre sin alterar su período.

#### Scenario: Pago recibido en noviembre aplicado a una deuda de octubre
- **WHEN** se registra un pago con `paymentDate` en noviembre y un período de octubre
- **THEN** el sistema guarda la fecha de noviembre y el período de octubre por separado, y lo aplica a la obligación de octubre

#### Scenario: El período no se sobrescribe con la fecha de pago
- **WHEN** se registra un pago cuya fecha de pago cae fuera de su período cubierto
- **THEN** el sistema conserva ambos valores tal como se enviaron

### Requirement: Payment Destination Selection

Al registrar un pago, el sistema SHALL permitir seleccionar a qué obligación corresponde:

- una deuda anterior,
- la inscripción vigente, o
- varias obligaciones, si el pago cubre más de una.

Cuando el usuario no especifique el destino, el sistema SHALL aplicar primero a la deuda más antigua y SHALL permitir revisar y modificar la distribución antes de confirmar.

El usuario SHALL poder ver el efecto del reparto (incluso por defecto) antes de confirmar el pago.

#### Scenario: Selección explícita de la obligación
- **WHEN** el usuario elige la inscripción vigente como destino
- **THEN** el sistema aplica el pago a esa inscripción

#### Scenario: Selección de una deuda anterior
- **WHEN** el usuario elige una inscripción anterior como destino
- **THEN** el sistema aplica el pago a esa deuda anterior

#### Scenario: Distribución revisable
- **WHEN** el usuario no especifica destino y el sistema propone un reparto por antigüedad
- **THEN** el usuario puede revisar y modificar la distribución antes de confirmar

#### Scenario: La inscripción activa se identifica sola
- **WHEN** el usuario registra un pago y existe una inscripción vigente
- **THEN** el sistema la identifica automáticamente como destino sugerido
