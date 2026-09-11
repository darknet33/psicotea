# Payments Specification

## Purpose

Gestión de pagos en Sistema_PsicoTea. Define registro de pagos, consultas por niño y periodo, cálculo de pagos pendientes y control de acceso.

## Requirements

### Requirement: Payment Registration

El sistema SHALL permitir registrar un pago con `childId`, `amount`, `paymentDate`, `method` (`EFECTIVO | TRANSFERENCIA | TARJETA | CHEQUE`), `reference` (opcional), `description` (opcional), `periodStart` y `periodEnd` (periodo que cubre), y `enrollmentId` (opcional).

#### Scenario: Pago registrado
- **WHEN** un usuario con permiso registra un pago valido
- **THEN** el sistema crea el pago y devuelve 201

#### Scenario: Monto invalido
- **WHEN** se registra un pago con `amount` menor o igual a cero
- **THEN** el sistema rechaza con error de validacion (400)

#### Scenario: Nino inexistente
- **WHEN** se registra un pago para un `childId` que no existe
- **THEN** el sistema devuelve 404

### Requirement: Payment Query

El sistema SHALL permitir consultar pagos por id, por nino, por periodo y listar todos, mediante endpoints protegidos.

- `GET /payments` — lista con filtros (`childId`, `periodStart`, `periodEnd`)
- `GET /payments/:id` — detalle
- `GET /payments/child/:childId` — historial de un nino
- `GET /payments/period?start=&end=` — pagos de un periodo

#### Scenario: Historial del nino
- **WHEN** un usuario consulta `GET /payments/child/:childId`
- **THEN** el sistema devuelve el historial ordenado por fecha del nino

#### Scenario: Pagos por periodo
- **WHEN** se consulta `GET /payments/period` con `start` y `end`
- **THEN** el sistema devuelve los pagos cuyo periodo se intersecta con el consultado

### Requirement: Pending Payments

El sistema SHALL permitir calcular los pagos pendientes: para cada inscripcion `ACTIVO`, la matricula mensual del periodo comparada contra los pagos registrados (que cubran ese periodo para el nino), devolviendo los nino/periodo/importe adeudados.

#### Scenario: Mensualidad sin pagar
- **WHEN** se consulta los pagos pendientes
- **THEN** el sistema devuelve los periodos con inscripcion ACTIVA sin pago que los cubra, con su importe adeudado

#### Scenario: Panel de deudores o filtros
- **WHEN** hay pagos pendientes
- **THEN** el endpoint `GET /payments/pending` los devuelve agregados por nino (o con filtros por nino)

### Requirement: Payment RBAC

El acceso a los endpoints de pagos SHALL cumplir la Permission Matrix de `user-roles` (CRUD para ADMIN y PERSONAL_ADMINISTRATIVO; sin acceso para ESPECIALISTA).

#### Scenario: Acceso permitido
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO opera sobre pagos
- **THEN** la operacion se ejecuta normalmente

#### Scenario: Acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta operar sobre pagos
- **THEN** el sistema devuelve 403 Forbidden