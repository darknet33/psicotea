# Enrollments Specification

## Purpose

Gestión de inscripciones de niños en Sistema_PsicoTea. Define creación de inscripciones, ciclo de vida de estado (`ACTIVO / INACTIVO / RETIRADO`), CRUD con filtros protegido por JWT y rol, tipos de inscripción con duración derivada, monto por período, inscripción vigente por rango de fechas, prevención de solapamiento, reinscripción con prefill y control de acceso.

## Requirements

### Requirement: Enrollment Creation

El sistema SHALL permitir crear una inscripción para un niño, indicando `childId`. Los datos de la inscripción SHALL ser:

- `type` — tipo de inscripción: `MENSUAL`, `TRIMESTRAL`, `SEMESTRAL` o `ANUAL`. Obligatorio.
- `startDate` — fecha de inicio del período.
- `amount` — monto de la inscripción **para el período completo**, obligatorio y mayor a cero. No es una cuota mensual y NO SHALL multiplicarse por la cantidad de meses.
- `status` — opcional, por defecto `ACTIVO`.
- `scheduleDays` — lista opcional de días de la semana con su turno.
- `areaIds` — lista opcional de áreas del catálogo.
- `notes` — opcional.
- `initialPayment` — opcional, con `amount`, `paymentDate`, `method`, `periodStart`, `periodEnd`, `reference` y `description`.

El sistema SHALL derivar `durationDays` y `endDate` a partir de `type` en el backend; el cliente NO SHALL enviar los días ni la fecha de fin.

La inscripción SHALL quedar creada junto con su agenda, sus áreas y su pago inicial en una **única transacción**: si alguna de esas partes falla, no se crea la inscripción.

`childId` SHALL ser obligatorio en el endpoint porque el backend no conoce el contexto, pero la UI SHALL ofrecer el alta únicamente desde el expediente del niño.

#### Scenario: Inscripción exitosa
- **WHEN** un usuario con permiso crea una inscripción con tipo, fecha de inicio y monto
- **THEN** el sistema crea la inscripción con estado `ACTIVO`, persiste `durationDays` y `endDate` derivados del tipo, y devuelve 201

#### Scenario: Niño inexistente
- **WHEN** se intenta inscribir a un `childId` que no existe
- **THEN** el sistema devuelve 404

#### Scenario: Monto obligatorio y positivo
- **WHEN** no se envía `amount`, o es menor o igual a cero
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Tipo obligatorio
- **WHEN** no se envía `type`, o no es uno de los cuatro tipos válidos
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Duración no la envía el cliente
- **WHEN** el cliente envía `durationDays` o `endDate` junto con el alta
- **THEN** el sistema los ignora y usa los derivados del tipo

#### Scenario: Días repetidos en la agenda
- **WHEN** la agenda incluye dos entradas para el mismo día de la semana
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Área inexistente
- **WHEN** se envían `areaIds` con un id que no existe en el catálogo
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Todo o nada
- **WHEN** la inscripción es válida pero el pago inicial o alguna de las áreas fallan
- **THEN** no queda ninguna inscripción creada: la operación se revierte por completo

### Requirement: Enrollment Status Lifecycle

El sistema SHALL mantener el ciclo de vida de estado `ACTIVO / INACTIVO / RETIRADO` y permitir cambiarlo mediante actualización de la inscripción, asignando `endDate` con la fecha actual cuando el estado deja de ser `ACTIVO` y el cliente no envió una explícita.

`childId` SHALL ser **inmutable**: `PATCH /enrollments/:id` no SHALL aceptarlo.

La vigencia de una inscripción NO SHALL depender únicamente de su estado: ver *Active Enrollment by Date Range*.

#### Scenario: Cambio a RETIRADO
- **WHEN** se actualiza el estado de una inscripción a `RETIRADO` sin enviar `endDate`
- **THEN** el sistema guarda el estado y asigna `endDate` con la fecha actual

#### Scenario: Transiciones válidas
- **WHEN** se cambia entre los estados permitidos y las fechas no se solapan con otra inscripción del niño
- **THEN** el sistema acepta la transición y devuelve la inscripción actualizada

#### Scenario: No se puede mover la inscripción de niño
- **WHEN** se envía `PATCH /enrollments/:id` con un `childId`
- **THEN** el sistema rechaza la operación con 400

### Requirement: Enrollment CRUD

El sistema SHALL permitir consultar, crear y actualizar inscripciones mediante endpoints protegidos por JWT y rol.

- `GET /enrollments` — listado agrupado por niño con los totales económicos
- `GET /enrollments/:id` — detalle completo de una inscripción
- `GET /enrollments/child/:childId` — inscripciones de un niño con sus totales
- `GET /enrollments/child/:childId/prefill` — sugerencias para reinscribir
- `GET /enrollments/child/:childId/summary` — resumen económico con inscripción vigente y deudas anteriores
- `POST /enrollments` — crear
- `PATCH /enrollments/:id` — actualizar (tipo, fechas, monto, estado, agenda y áreas)

`PATCH /enrollments/:id` SHALL aceptar `type`, `startDate`, `amount`, `status`, `notes`, `scheduleDays` y `areaIds`. Cuando se envía `type` o `startDate`, el sistema SHALL recalcular `endDate`. Al recibir `scheduleDays` o `areaIds` SHALL **reemplazar** el conjunto completo anterior.

#### Scenario: Consulta por niño
- **WHEN** se consulta `GET /enrollments/child/:childId`
- **THEN** el sistema devuelve el historial de inscripciones con su tipo, monto, pagado y saldo

#### Scenario: Recálculo al cambiar el tipo o la fecha
- **WHEN** se envía `PATCH /enrollments/:id` con un nuevo `type` o `startDate`
- **THEN** el sistema recalcula y persiste `durationDays` y `endDate`

#### Scenario: Solo lectura para el ESPECIALISTA
- **WHEN** un ESPECIALISTA intenta crear o actualizar una inscripción
- **THEN** el sistema devuelve 403 Forbidden

### Requirement: Enrollment Type and Duration

El sistema SHALL derivar la duración de la inscripción a partir de su tipo, con esta correspondencia:

- `MENSUAL` → 30 días.
- `TRIMESTRAL` → 90 días.
- `SEMESTRAL` → 180 días.
- `ANUAL` → 360 días.

La duración SHALL calcularse en el backend; el usuario NO SHALL introducir días manualmente. `endDate` SHALL derivarse como `startDate + durationDays`.

#### Scenario: Tipo mensual
- **WHEN** se crea una inscripción `MENSUAL` con `startDate` 2026-01-15
- **THEN** el sistema persiste `durationDays: 30` y `endDate: 2026-02-14`

#### Scenario: Tipo trimestral
- **WHEN** se crea una inscripción `TRIMESTRAL`
- **THEN** el sistema persiste `durationDays: 90` y `endDate` 90 días después del inicio

#### Scenario: Tipo semestral
- **WHEN** se crea una inscripción `SEMESTRAL`
- **THEN** el sistema persiste `durationDays: 180`

#### Scenario: Tipo anual
- **WHEN** se crea una inscripción `ANUAL`
- **THEN** el sistema persiste `durationDays: 360`

### Requirement: Custom Enrollment Amount

El monto de una inscripción SHALL ser **personalizado por niño e inscripción**. El sistema NO SHALL imponer una tarifa general ni copiar obligatoriamente el precio de otra inscripción.

El monto SHALL corresponder al **período completo** de la inscripción. Si una inscripción trimestral tiene `amount: 2400`, la obligación total SHALL ser Bs 2.400 y NO SHALL calcularse como Bs 7.200 ni dividirse automáticamente entre sus meses.

Cada inscripción SHALL conservar su propio monto histórico aunque el precio cambie en inscripciones futuras.

El `amount` SHALL ser mayor a cero; valores negativos o cero SHALL rechazarse.

#### Scenario: Montos distintos por niño
- **WHEN** el niño A se inscribe con monto Bs 750 y el niño B con Bs 1.100
- **THEN** cada inscripción conserva su monto independiente

#### Scenario: Monto trimestral no multiplicado
- **WHEN** se registra una inscripción `TRIMESTRAL` con `amount: 2400`
- **THEN** el total de la inscripción es Bs 2.400

#### Scenario: Monto mensual
- **WHEN** se registra una inscripción `MENSUAL` con `amount: 750`
- **THEN** el total de la inscripción es Bs 750

#### Scenario: Monto inválido
- **WHEN** se intenta registrar una inscripción con `amount` negativo o cero
- **THEN** el sistema devuelve 400

#### Scenario: El monto histórico no cambia
- **WHEN** se crea una nueva inscripción del mismo niño con un monto distinto
- **THEN** la inscripción anterior conserva su monto original

### Requirement: Active Enrollment by Date Range

Una inscripción SHALL considerarse **vigente** cuando la fecha actual se encuentra entre su `startDate` y su `endDate`, ambas inclusive, y su estado es `ACTIVO`.

El sistema SHALL exponer la condición de vigencia en el listado y en el detalle.

#### Scenario: Inscripción vigente
- **WHEN** hoy está entre `startDate` y `endDate` de una inscripción `ACTIVO`
- **THEN** el sistema la marca como vigente

#### Scenario: Inscripción vencida
- **WHEN** hoy es posterior al `endDate` de la inscripción
- **THEN** el sistema la marca como no vigente

#### Scenario: Inscripción futura
- **WHEN** hoy es anterior al `startDate` de la inscripción
- **THEN** el sistema la marca como no vigente

#### Scenario: Inscripción retirada dentro del rango
- **WHEN** una inscripción está dentro del rango de fechas pero su estado no es `ACTIVO`
- **THEN** el sistema no la marca como vigente

### Requirement: Enrollment Overlap Prevention

El sistema NO SHALL permitir crear ni actualizar una inscripción cuyas fechas se solapen con otra inscripción del mismo niño, independientemente del estado de ambas.

Dos rangos SHALL considerarse solapados cuando `a.startDate <= b.endDate` y `b.startDate <= a.endDate`.

#### Scenario: Alta con solapamiento
- **WHEN** se intenta crear una inscripción cuyas fechas se solapan con otra del mismo niño
- **THEN** el sistema devuelve 400 y no la crea

#### Scenario: Reinscripción continua
- **WHEN** se crea una inscripción que empieza el día siguiente al `endDate` de la anterior
- **THEN** el sistema la acepta, porque los rangos no se solapan

#### Scenario: Inscripción futura permitida
- **WHEN** la inscripción vigente termina el 31 de octubre y la nueva empieza el 1 de noviembre
- **THEN** el sistema acepta la nueva sin exigir retirar la anterior

#### Scenario: Edición que genera solapamiento
- **WHEN** se actualiza una inscripción con fechas que se solapan con otra del niño
- **THEN** el sistema devuelve 400

### Requirement: Reenrollment Suggestions

El sistema SHALL permitir obtener los datos para prellenar una reinscripción a partir de la inscripción anterior del mismo niño.

`GET /enrollments/child/:childId/prefill` SHALL devolver la inscripción más reciente y sus valores sugeridos:

- `type` — el tipo de la inscripción anterior.
- `amount` — el monto de la inscripción anterior.
- `startDate` — el día siguiente al `endDate` de la inscripción anterior.
- `areaIds` — las áreas de la inscripción anterior.
- `scheduleDays` — la agenda de la inscripción anterior.

Los valores SHALL ser **sugerencias editables**; el usuario SHALL poder modificar el tipo, el monto y las fechas antes de confirmar. La reinscripción NO SHALL cerrar, eliminar ni alterar la inscripción anterior, sus deudas ni sus pagos.

#### Scenario: Prefill con inscripción anterior
- **WHEN** se consulta el prefill de un niño con inscripción anterior que termina el 2026-04-15
- **THEN** el sistema propone `startDate: 2026-04-16`, el `type` y el `amount` anteriores

#### Scenario: El monto sugerido es editable
- **WHEN** el usuario cambia el monto sugerido antes de guardar
- **THEN** la nueva inscripción conserva el monto editado, no el sugerido

#### Scenario: La inscripción anterior no se modifica
- **WHEN** se completa la reinscripción
- **THEN** la inscripción anterior conserva su estado, su monto, sus deudas y sus pagos

#### Scenario: Niño sin inscripciones
- **WHEN** se consulta el prefill de un niño que nunca fue inscrito
- **THEN** el sistema devuelve 404 y el frontend abre el formulario vacío

### Requirement: Enrollment Economic Summary

El sistema SHALL devolver, por inscripción y por niño, un resumen económico con:

- `total` — el `amount` de la inscripción.
- `pagado` — la suma de las allocations de pagos aplicadas a esa inscripción.
- `saldo` — `total − pagado`.

`GET /enrollments/child/:childId/summary` SHALL devolver las inscripciones del niño con su resumen, identificando la vigente y separando las deudas anteriores. Los totales SHALL ser `number` en la respuesta JSON.

#### Scenario: Resumen de la inscripción vigente
- **WHEN** se consulta el resumen de un niño con una inscripción vigente
- **THEN** el sistema devuelve su tipo, fechas, monto, total pagado y saldo pendiente

#### Scenario: Totales numéricos
- **WHEN** se consulta el resumen
- **THEN** `total`, `pagado` y `saldo` llegan como números, no como cadenas

#### Scenario: Inscripción sin pagos
- **WHEN** una inscripción no tiene allocations
- **THEN** el sistema devuelve `pagado: 0` y `saldo` igual al `amount`

### Requirement: Previous Debts

El sistema SHALL mostrar por separado las deudas pendientes de inscripciones anteriores y el saldo pendiente de la inscripción vigente. Ambas SHALL calcularse con los datos reales de cada inscripción, sin usar cantidades fijas.

Las deudas de inscripciones anteriores NO SHALL impedir automáticamente la reinscripción ni SHALL eliminarse al reinscribir.

#### Scenario: Deuda anterior persistente
- **WHEN** un niño tiene una inscripción anterior con saldo pendiente y se crea una nueva inscripción
- **THEN** la deuda anterior sigue mostrándose como deuda anterior y no se elimina

#### Scenario: Deuda anterior y saldo vigente separados
- **WHEN** se consulta el resumen de un niño con deuda anterior y saldo vigente
- **THEN** el sistema informa ambos valores por separado

### Requirement: Enrollment Period Reference

El sistema SHALL mostrar el mes o período al que corresponde cada pago dentro del historial, como referencia visual. Para una inscripción mensual, el período SHALL ser normalmente el mes de la inscripción.

Para inscripciones trimestrales, semestrales o anuales, el período SHALL mostrarse como referencia y NO SHALL crear automáticamente una obligación por mes. El monto total SHALL seguir perteneciendo a la inscripción completa.

#### Scenario: Referencia mensual
- **WHEN** se consulta el historial de una inscripción mensual
- **THEN** cada pago muestra el mes al que corresponde

#### Scenario: Inscripción trimestral sin cargos por mes
- **WHEN** una inscripción trimestral tiene un período de tres meses
- **THEN** el sistema no genera tres obligaciones separadas; el total sigue siendo el `amount` de la inscripción

### Requirement: Enrollment RBAC

El acceso a los endpoints de inscripciones SHALL cumplir la Permission Matrix de `user-roles` (CRUD para ADMIN y PERSONAL_ADMINISTRATIVO; sin acceso para ESPECIALISTA).

#### Scenario: Acceso permitido
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO opera sobre inscripciones
- **THEN** la operación se ejecuta normalmente

#### Scenario: Acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta operar sobre inscripciones
- **THEN** el sistema devuelve 403 Forbidden