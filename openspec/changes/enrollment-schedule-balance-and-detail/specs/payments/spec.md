## MODIFIED Requirements

### Requirement: Payment Registration

El sistema SHALL permitir registrar pagos de inscripciones existen registrados.

Los pagos se registran contra una inscripción existente (`enrollmentId`), con:

- `amount` — monto del pago.
- `method` — método de pago: `EFECTIVO`, `QR` o `TRANSFERENCIA`.
- `periodStart` / `periodEnd` — período de cobertura del pago.
- `reference` — opcional.
- `description` — opcional, como "pago mensual de junio".

El acceso SHALL requerir un usuario con permiso de escritura sobre pagos.

#### Scenario: Registro de pago
- **WHEN** un usuario registra un pago de una inscripción existente
- **THEN** el sistema guarda el pago con su monto, método y período, y lo asocia a esa inscripción

#### Scenario: Método de pago inválido
- **WHEN** se intenta registrar un pago con un método de pago no válido
- **THEN** el sistema rechaza el registro

#### Scenario: Monto obligatorio
- **WHEN** se intenta registrar un pago sin monto, o con monto menor o igual a cero
- **THEN** el sistema rechaza el registro indicando que el monto es obligatorio

#### Scenario: Método de pago obligatorio
- **WHEN** se intenta registrar un pago sin método de pago
- **THEN** el sistema rechaza el registro indicando que el método de pago es obligatorio

#### Scenario: Inscripción inexistente
- **WHEN** se intenta registrar un pago contra una inscripción que no existe
- **THEN** el sistema rechaza el registro

#### Scenario: Método de pago vigente
- **WHEN** un usuario abre el selector de método de pago
- **THEN** solo se ofrecen `EFECTIVO`, `QR` y `TRANSFERENCIA`

### Requirement: Pending Payment Calculation

El sistema SHALL calcular los pagos pendientes de una inscripción comparando el total facturado contra el total pagado.

Los pagos pendientes SHALL derivarse de la inscripción (`monthlyFee`, `startDate`) y del monto cubierto por los pagos registrados. Se conservan los meses pendientes y el saldo de la inscripción.

El cálculo SHALL seguir siendo consistente con el saldo que devuelve el detalle de inscripción.

#### Scenario: Cálculo de mensualidad pendiente
- **WHEN** se consulta una inscripción con pagos que cubren solo algunos meses de su período
- **THEN** el sistema indica los meses pendientes y el saldo de la inscripción

#### Scenario: Coherencia con el saldo de la inscripción
- **WHEN** una inscripción tiene pagos pendientes según el cálculo mensual
- **THEN** el saldo que devuelve el detalle de esa inscripción es coherente con ese cálculo