# Payments Pages Specification

## Purpose

Paginas de pagos en Sistema_PsicoTea. Define listado, formulario de registro con destino (allocation) revisable, vista de pagos pendientes que separa deudas anteriores de la vigente, historial dentro del expediente y el control de acceso por rol.

## Requirements

### Requirement: Payments List

El frontend SHALL mostrar el listado de pagos en `/payments` con niño, fecha de pago, monto, método, período cubierto, inscripción asociada y acciones, consumiendo `GET /payments`. SHALL incluir estados de carga/vacío/error.

#### Scenario: Listado cargado
- **WHEN** un usuario con permiso abre `/payments`
- **THEN** se muestran los pagos ordenados por fecha con su período e inscripción

#### Scenario: Sin pagos
- **WHEN** la API devuelve una lista vacía
- **THEN** la tabla muestra el estado vacío

### Requirement: Payment Registration

El frontend SHALL ofrecer un formulario de registro de pago con:

- Niño (selector o el del expediente).
- **Monto recibido**.
- **Fecha de pago** (cuándo se recibió el dinero), independiente del período.
- **Método** (`EFECTIVO`, `QR`, `TRANSFERENCIA`).
- **Período correspondiente** (`periodStart`/`periodEnd`), con inicio y fin independientes.
- **Destino**: una deuda anterior, la inscripción vigente, o varias obligaciones.
- Referencia y descripción opcionales.

Validado con zod. Al enviar llama a `POST /payments`. La UI NO SHALL completar la fecha de fin del período con la fecha de inicio, ni forzar el período al mes actual.

#### Scenario: Pago exitoso
- **WHEN** el usuario completa monto, fecha de pago, período y destino
- **THEN** se registra el pago (201) y el listado se refresca con toast de éxito

#### Scenario: Inicio y fin del período independientes
- **WHEN** el usuario selecciona el período que cubre el pago
- **THEN** puede elegir un mes de inicio y un mes de fin distintos

#### Scenario: Monto inválido
- **WHEN** el monto es menor o igual a cero
- **THEN** el formulario muestra error y no se envía

#### Scenario: Fecha de pago distinta del período
- **WHEN** el usuario registra un pago en noviembre aplicado al período de octubre
- **THEN** el formulario envía la fecha de pago de noviembre y el período de octubre por separado

### Requirement: Pending Payments View

El frontend SHALL mostrar las deudas en `/payments/pending` consumiendo el endpoint correspondiente, agrupadas por niño y separando las deudas anteriores de la inscripción vigente, con su saldo pendiente calculado con datos reales. SHALL permitir iniciar el registro del cobro desde esa vista.

#### Scenario: Deudores visibles
- **WHEN** hay inscripciones con saldo pendiente
- **THEN** la vista muestra cada niño con su inscripción, período de referencia y saldo pendiente

#### Scenario: Deuda anterior separada
- **WHEN** un niño tiene deuda anterior y saldo vigente
- **THEN** la vista los muestra por separado

#### Scenario: Sin deudas
- **WHEN** todas las inscripciones tienen saldo menor o igual a cero
- **THEN** la vista muestra el estado vacío "No hay deudas pendientes"

### Requirement: Payment History per Child

El frontend SHALL mostrar el historial de pagos de un niño dentro de su expediente (`/children/[id]`), agrupado por inscripción y período, con fecha del pago, período al que se aplica, monto recibido, método, referencia o descripción e inscripción relacionada.

#### Scenario: Historial agrupado por inscripción
- **WHEN** se abre el expediente de un niño con pagos
- **THEN** la sección de pagos los agrupa por inscripción y muestra el período de cada uno

#### Scenario: Identificación del período
- **WHEN** el usuario consulta un pago
- **THEN** puede ver a qué período y a qué inscripción corresponde

### Requirement: Payment Allocation UI

El formulario de pago SHALL permitir seleccionar el destino del pago: una deuda anterior, la inscripción vigente, o varias obligaciones. SHALL identificar automáticamente la inscripción vigente cuando exista y SHALL proponer por defecto la aplicación a la deuda más antigua.

El usuario SHALL poder revisar y modificar la distribución propuesta antes de confirmar, viendo el saldo resultante de cada obligación.

#### Scenario: Destino único
- **WHEN** el usuario elige una sola obligación como destino
- **THEN** el formulario envía una allocation a esa inscripción

#### Scenario: Distribución entre varias obligaciones
- **WHEN** el pago cubre una deuda anterior y la inscripción vigente
- **THEN** el usuario puede repartir el monto entre ambas y revisarlo antes de confirmar

#### Scenario: Sugerencia por antigüedad
- **WHEN** el usuario no elige destino
- **THEN** el formulario propone aplicar primero a la deuda más antigua y permite modificarlo

#### Scenario: Inscripción vigente autoidentificada
- **WHEN** existe una inscripción vigente al abrir el formulario
- **THEN** se preselecciona como destino sugerido

### Requirement: Payment History by Period

El historial SHALL mostrar el mes o período de referencia de cada pago y SHALL agrupar visualmente los pagos por inscripción y período, sin convertir cada mes de una inscripción trimestral, semestral o anual en una obligación independiente.

#### Scenario: Referencia mensual en el historial
- **WHEN** se consulta el historial de una inscripción mensual
- **THEN** cada pago muestra su mes de referencia

#### Scenario: Inscripción de período largo
- **WHEN** se consulta el historial de una inscripción trimestral
- **THEN** los pagos se muestran agrupados en el período de la inscripción, sin generar obligaciones mensuales

### Requirement: Payment Type Distinction

El historial SHALL diferenciar visualmente:

- los pagos normales,
- los pagos atrasados (registrados después de su período), y
- los pagos distribuidos entre varias obligaciones.

#### Scenario: Pago atrasado
- **WHEN** un pago tiene fecha de pago posterior a su período cubierto
- **THEN** la UI lo marca como atrasado

#### Scenario: Pago distribuido
- **WHEN** un pago tiene allocations en más de una inscripción
- **THEN** la UI lo marca como distribuido y muestra el detalle del reparto

### Requirement: Payments RBAC (frontend)

Las pantallas de pagos SHALL estar visibles solo para ADMIN y PERSONAL_ADMINISTRATIVO; el sidebar no SHALL mostrar "Pagos" al ESPECIALISTA.

#### Scenario: Acceso por rol
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO abre `/payments` o `/payments/pending`
- **THEN** ve y registra pagos normalmente

#### Scenario: Sin acceso
- **WHEN** un ESPECIALISTA intenta operar sobre pagos
- **THEN** el backend devuelve 403 (el item no aparece en su sidebar)