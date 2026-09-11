## ADDED Requirements

### Requirement: Payments List

El frontend SHALL mostrar el listado de pagos en `/payments` con nino, monto, metodo, fecha, periodo cubierto y acciones, consumiendo `GET /payments`. SHALL incluir estados de carga/vacio/error.

#### Scenario: Listado cargado
- **WHEN** un usuario con permiso abre `/payments`
- **THEN** se muestran los pagos en una tabla ordenada por fecha

#### Scenario: Sin pagos
- **WHEN** la API devuelve una lista vacia
- **THEN** la tabla muestra el estado vacio

### Requirement: Payment Registration

El frontend SHALL ofrecer un formulario de registro de pago con nino (selector), `amount`, `paymentDate`, `method` (EFECTIVO/TRANSFERENCIA/TARJETA/CHEQUE), periodo que cubre (`periodStart`/`periodEnd`) y `reference`/`description` opcionales, validado con zod. Al enviar llama a `POST /payments`.

#### Scenario: Pago exitoso
- **WHEN** el usuario completa el formulario valido y envia
- **THEN** se registra el pago (201) y el listado se refresca con toast de exito

#### Scenario: Monto invalido
- **WHEN** `amount` es <= 0
- **THEN** el formulario muestra error y no se envia

### Requirement: Pending Payments View

El frontend SHALL mostrar los pagos pendientes en `/payments/pending` consumiendo `GET /payments/pending`, agrupados por nino con los periodos adeudados (`YYYY-MM`) y su importe, permitiendo iniciar el registro del cobro desde esa vista.

#### Scenario: Deudores visibles
- **WHEN** hay inscripciones ACTIVAS con periodos sin pago que los cubra
- **THEN** la vista muestra cada nino con sus periodos y montos adeudados (badge rojo/amonestacion)

#### Scenario: Sin deudas
- **WHEN** todos los periodos estan cubiertos
- **THEN** la vista muestra el estado vacio "No hay pagos pendientes"

### Requirement: Payment History per Child

El frontend SHALL mostrar el historial de pagos de un nino dentro de su expediente (`/children/[id]`) consumiendo `GET /payments/child/:childId`, ordenado por fecha descendente.

#### Scenario: Historial del nino
- **WHEN** se abre el expediente de un nino
- **THEN** la seccion de pagos muestra su historial ordenado por fecha

### Requirement: Payments RBAC (frontend)

Las pantallas de pagos SHALL estar visibles solo para ADMIN y PERSONAL_ADMINISTRATIVO; el sidebar no SHALL mostrar "Pagos" al ESPECIALISTA.

#### Scenario: Acceso por rol
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO abre `/payments` o `/payments/pending`
- **THEN** ve y registra pagos normalmente

#### Scenario: Sin acceso
- **WHEN** un ESPECIALISTA intenta operar sobre pagos
- **THEN** el backend devuelve 403 (el item no aparece en su sidebar)