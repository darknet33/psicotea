## ADDED Requirements

### Requirement: Payment Allocation Entity

El sistema SHALL registrar la aplicación de cada pago a una o varias inscripciones mediante la entidad `PaymentAllocation`, adaptada al modelo existente. Cada `PaymentAllocation` SHALL tener `paymentId`, `enrollmentId`, `amount` y `createdAt`, con la restricción de una sola allocation por par `(paymentId, enrollmentId)`.

Un `Payment` SHALL conservar su movimiento original (monto total, fecha, método, referencia) y SHALL distribuirse entre las obligaciones que corresponda sin duplicar el ingreso ni perder su trazabilidad.

`Payment.enrollmentId` SHALL conservarse como inscripción principal de compatibilidad, derivada de las allocations. El cálculo de saldos SHALL basarse en `PaymentAllocation`, no en `Payment.enrollmentId`.

#### Scenario: Pago aplicado a una sola obligación
- **WHEN** se registra un pago de Bs 800 con destino a una única inscripción
- **THEN** el sistema crea una `PaymentAllocation` por Bs 800 y el saldo de esa inscripción se reduce en Bs 800

#### Scenario: Pago distribuido entre varias obligaciones
- **WHEN** se registra un pago de Bs 1.150 y se distribuye en Bs 350 a una deuda anterior y Bs 800 a la inscripción activa
- **THEN** el sistema conserva el pago original de Bs 1.150 y registra dos allocations con esos montos, dejando ambas obligaciones con el saldo correcto

#### Scenario: La suma de allocations no coincide con el pago
- **WHEN** se envían allocations cuya suma difiere del `amount` del pago
- **THEN** el sistema rechaza la operación con 400 y no registra el pago

#### Scenario: Obligación de otro niño
- **WHEN** se intenta aplicar un pago a una inscripción que no pertenece al niño del pago
- **THEN** el sistema rechaza la operación con 400

#### Scenario: Trazabilidad conservada
- **WHEN** se consulta un pago distribuido en varias obligaciones
- **THEN** el sistema devuelve el pago original con la lista de sus allocations

### Requirement: Payment Allocation Ordering

Cuando el usuario no especifica el destino de un pago, el sistema SHALL aplicar el monto **primero a la deuda más antigua** y continuar en orden de antigüedad (`startDate asc`) hasta agotar el pago.

El excedente de un pago que supera la deuda total SHALL aplicarse a la inscripción más reciente de ese niño como saldo a favor, de modo que el dinero no se descarte ni se pierda.

El cálculo SHALL hacerse en centavos, de modo que la suma de las allocations sea exactamente igual al monto del pago; el residuo de redondeo, si lo hubiera, SHALL asignarse a la obligación más antigua.

#### Scenario: Aplicación a la deuda más antigua
- **WHEN** un niño tiene una deuda anterior y una inscripción activa, y no se indica el destino del pago
- **THEN** el sistema aplica primero a la deuda anterior

#### Scenario: Pago que cubre solo parte de la deuda
- **WHEN** un pago es menor que la deuda más antigua
- **THEN** el saldo de esa obligación queda con la diferencia pendiente y no se aplica nada a las más recientes

#### Scenario: Excedente como saldo a favor
- **WHEN** un pago supera la deuda total del niño
- **THEN** el excedente queda aplicado a la inscripción más reciente y el saldo de esa inscripción puede resultar negativo

### Requirement: Enrollment Balance From Allocations

El sistema SHALL calcular el saldo de una inscripción como `amount − Σ PaymentAllocation.amount` de esa inscripción. Un saldo positivo indica deuda; uno negativo, saldo a favor.

El saldo de una inscripción NO SHALL depender del número de meses que abarque su período ni multiplicar el monto por la cantidad de meses.

#### Scenario: Pago parcial
- **WHEN** una inscripción de Bs 2.400 recibe dos pagos de Bs 900 y Bs 700
- **THEN** el sistema devuelve `pagado: 1600` y `saldo: 800`

#### Scenario: Pago completo
- **WHEN** una inscripción de Bs 750 recibe un pago de Bs 750
- **THEN** el sistema devuelve `saldo: 0`

#### Scenario: Saldo no multiplicado por meses
- **WHEN** una inscripción trimestral tiene `amount: 2400`
- **THEN** el total de la obligación es Bs 2.400, no Bs 7.200

#### Scenario: Pago sin allocation no afecta el saldo
- **WHEN** existe un pago histórico sin `PaymentAllocation`
- **THEN** ese pago no modifica el saldo de ninguna inscripción y queda reportado para revisión

### Requirement: Payment Allocation Transaction

El registro de un pago y la creación de sus allocations SHALL ejecutarse en una **única transacción**. Si alguna allocation falla, no SHALL quedar el pago registrado ni allocations parciales.

#### Scenario: Todo o nada
- **WHEN** falla una de las allocations de un pago distribuido
- **THEN** el sistema revierte el pago y todas sus allocations, sin dejar saldos inconsistentes
