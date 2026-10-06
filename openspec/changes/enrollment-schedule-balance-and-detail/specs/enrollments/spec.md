## MODIFIED Requirements

### Requirement: Enrollment Creation

El sistema SHALL permitir crear una inscripción para un niño, indicando `childId`. Los datos de la inscripción SHALL ser:

- `startDate` — fecha de inscripción. Es también la fecha de inicio del período de atención.
- `durationDays` — duración de la inscripción **en días calendario**. El sistema SHALL calcular y persistir `endDate` como `startDate + durationDays`. `endDate` SHALL quedar siempre derivado y no se envía desde el cliente.
- `monthlyFee` — monto mensual, obligatorio y mayor a cero.
- `status` — opcional, por defecto `ACTIVO`.
- `scheduleDays` — lista opcional de días de la semana con su turno (ver *Enrollment Schedule*).
- `areaIds` — lista opcional de áreas del catálogo (ver *Enrollment Areas*).
- `notes` — opcional.
- `initialPayment` — opcional, con `amount`, `method`, `periodStart`, `periodEnd`, `reference` y `description` opcionales (ver *Enrollment Initial Payment*).

La inscripción SHALL quedar creada junto con su agenda, sus áreas y su pago inicial en una **única transacción**: si alguna de esas partes falla, no se crea la inscripción.

`childId` SHALL ser obligatorio en el endpoint porque el backend no sabe el contexto, pero la UI SHALL ofrecer el alta únicamente desde el expediente del niño y **sin selector de niño**.

#### Scenario: Inscripción exitosa
- **WHEN** un usuario con permiso inscribe a un niño con fecha, duración, monto y agenda
- **THEN** el sistema crea la inscripción con estado `ACTIVO`, persiste `endDate` calculado a partir de `durationDays`, guarda los días de agenda y las áreas indicadas, y devuelve 201

#### Scenario: Niño inexistente
- **WHEN** se intenta inscribir a un `childId` que no existe
- **THEN** el sistema devuelve 404

#### Scenario: Monto obligatorio
- **WHEN** no se envía `monthlyFee`, o es menor o igual a cero
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Duración obligatoria y positiva
- **WHEN** no se envía `durationDays`, o es menor o igual a cero
- **THEN** el sistema rechaza la inscripción con 400 indicando que la duración debe ser mayor a cero

#### Scenario: Días repetidos
- **WHEN** la agenda incluye dos entradas para el mismo día de la semana
- **THEN** el sistema rechaza la inscripción con 400, porque un día solo puede tener un turno

#### Scenario: Día de la semana inválido
- **WHEN** la agenda incluye un `dayOfWeek` fuera del rango 1..7
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Turno inválido
- **WHEN** la agenda incluye un `shift` que no es `TODO_DIA`, `MANANA` ni `TARDE`
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Área inexistente
- **WHEN** se envían `areaIds` con un id que no existe en el catálogo
- **THEN** el sistema rechaza la inscripción con 400

#### Scenario: Todo o nada
- **WHEN** la inscripción es válida pero el pago inicial o alguna de las áreas fallan
- **THEN** no queda ninguna inscripción creada: la operación se revierte por completo

### Requirement: Enrollment Status Lifecycle

El sistema SHALL mantener el ciclo de vida de estado `ACTIVO / INACTIVO / RETIRADO` y permitir cambiarlo mediante actualización de la inscripción, asignando `endDate` con la fecha actual cuando el estado deja de ser `ACTIVO` y el cliente no envió una explícita.

`childId` SHALL ser **inmutable**: `PATCH /enrollments/:id` no SHALL aceptarlo. Mover una inscripción a otro niño se rechaza con 400. Para corregir una inscripción capturada con el niño equivocado, se retira y se crea una nueva.

#### Scenario: Cambio a RETIRADO
- **WHEN** se actualiza el estado de una inscripción a `RETIRADO` sin enviar `endDate`
- **THEN** el sistema guarda el estado y asigna `endDate` con la fecha actual

#### Scenario: Transiciones válidas
- **WHEN** se cambia entre los estados permitidos y no hay conflicto con otra inscripción `ACTIVO` del mismo niño
- **THEN** el sistema acepta la transición y devuelve la inscripción actualizada

#### Scenario: Listado por estado
- **WHEN** se consulta inscripciones filtrando por `status`
- **THEN** el sistema devuelve solo las de ese estado

#### Scenario: No se puede mover la inscripción de niño
- **WHEN** se envía `PATCH /enrollments/:id` con un `childId`
- **THEN** el sistema rechaza la operación con 400, porque `childId` es inmutable tras crear

### Requirement: Enrollment CRUD

El sistema SHALL permitir consultar, crear y actualizar inscripciones mediante endpoints protegidos por JWT y rol.

- `GET /enrollments` — listado **agrupado por niño** (ver *Enrollment Grouped Listing*)
- `GET /enrollments/:id` — detalle completo de una inscripción (ver *Enrollment Detail*)
- `GET /enrollments/child/:childId` — inscripciones de un niño
- `POST /enrollments` — crear
- `PATCH /enrollments/:id` — actualizar (incluye cambio de estado, reemplazo de agenda y de áreas)

`PATCH /enrollments/:id` SHALL aceptar `startDate`, `durationDays` (recalculando `endDate`), `status`, `monthlyFee`, `notes`, `scheduleDays` y `areaIds`. Al recibir `scheduleDays` o `areaIds` SHALL **reemplazar** el conjunto completo anterior, no agregarle elementos.

**BREAKING**: `GET /enrollments` ya no devuelve un array plano de inscripciones, sino un objeto agrupado. Los clientes que lo consumen SHALL adaptarse.

#### Scenario: Consulta por niño
- **WHEN** se consulta `GET /enrollments/child/:childId`
- **THEN** el sistema devuelve el historial de inscripciones de ese niño con su agenda, áreas y totales

#### Scenario: Actualización de agenda y áreas
- **WHEN** se envía `PATCH /enrollments/:id` con una agenda y un conjunto de áreas
- **THEN** el sistema reemplaza la agenda y las áreas anteriores por las nuevas y devuelve la inscripción actualizada

#### Scenario: Recálculo de la fecha de fin
- **WHEN** se envía `PATCH /enrollments/:id` con un nuevo `startDate` o una nueva `durationDays`
- **THEN** el sistema recalcula y persiste `endDate` en consecuencia

#### Scenario: Solo lectura para el ESPECIALISTA
- **WHEN** un ESPECIALISTA intenta crear o actualizar una inscripción
- **THEN** el sistema devuelve 403 Forbidden

## ADDED Requirements

### Requirement: Enrollment Schedule

El sistema SHALL registrar la agenda semanal de una inscripción: qué días de la semana asiste el niño y en qué turno. Cada día marcado SHALL tener su propio turno, de modo que una inscripción puede tener, por ejemplo, lunes y miércoles por la mañana y viernes por la tarde.

El turno SHALL ser uno de `TODO_DIA`, `MANANA` o `TARDE`. El día de la semana SHALL ser un entero del 1 (lunes) al 7 (domingo), y cada día SHALL tener **como máximo un turno** por inscripción.

La agenda SHALL ser opcional: una inscripción puede no tener días marcados.

Esta agenda es **informativa**. No SHALL cambiar el cálculo de pagos ni condicionar el registro de asistencia en esta versión.

#### Scenario: Agenda con turnos distintos por día
- **WHEN** se crea una inscripción con lunes `MANANA`, miércoles `TARDE` y viernes `TODO_DIA`
- **THEN** el sistema guarda las tres entradas y las devuelve en el detalle de la inscripción

#### Scenario: Inscripción sin agenda
- **WHEN** se crea una inscripción sin `scheduleDays`
- **THEN** el sistema la crea con la agenda vacía, sin error

#### Scenario: No se puede marcar dos veces el mismo día
- **WHEN** se intenta guardar una agenda con dos entradas para el mismo `dayOfWeek`
- **THEN** el sistema responde 400

#### Scenario: Quitar un día de la agenda
- **WHEN** se actualiza la inscripción con una agenda que omite un día antes marcado
- **THEN** ese día deja de estar en la agenda de la inscripción

### Requirement: Enrollment Areas

El sistema SHALL asociar opcionalmente una inscripción con uno o más áreas del catálogo, mediante la relación N:N `EnrollmentArea` definida en `enrollment-area-catalog`.

Las áreas son opcionales y pueden incluirse áreas inactivas en el detalle de una inscripción ya existente, para que el historial no cambie al desactivar un área.

#### Scenario: Inscripción con áreas
- **WHEN** se crea una inscripción con `areaIds: [1, 3]`
- **THEN** el sistema guarda ambas asociaciones y las devuelve en el detalle

#### Scenario: Inscripción sin áreas
- **WHEN** se crea una inscripción sin `areaIds`
- **THEN** el sistema la crea sin áreas asociadas, sin error

#### Scenario: Reemplazo de áreas
- **WHEN** se actualiza una inscripción con un conjunto de áreas distinto
- **THEN** el sistema sustituye el conjunto anterior por el nuevo

#### Scenario: Área desactivada en el historial
- **WHEN** un área asociada a una inscripción pasa a `isActive: false`
- **THEN** la inscripción la sigue mostrando en su detalle, identificada como inactiva

### Requirement: Enrollment Initial Payment

El sistema SHALL permitir registrar un pago inicial al momento de crear la inscripción. El pago inicial SHALL tener `amount`, `method` (`EFECTIVO | QR | TRANSFERENCIA`), `periodStart` y `periodEnd`, con `reference` y `description` opcionales.

El pago inicial SHALL quedar asociado a la inscripción recién creada mediante `enrollmentId`, de modo que cuente para su saldo. El endpoint `POST /enrollments` SHALL delegar la validación del pago a la misma lógica de `POST /payments`.

El pago inicial SHALL ser opcional en el endpoint: una inscripción puede crearse sin él, por ejemplo cuando el cobro queda pendiente de acordar.

#### Scenario: Inscripción con pago inicial
- **WHEN** se crea una inscripción con `initialPayment` completo
- **THEN** el sistema crea el pago asociado a esa inscripción dentro de la misma transacción y el saldo de la inscripción ya lo descuenta

#### Scenario: Inscripción sin pago inicial
- **WHEN** se crea una inscripción sin `initialPayment`
- **THEN** el sistema la crea igual, con saldo igual a lo facturado

#### Scenario: Monto del pago inicial inválido
- **WHEN** el `initialPayment` viene con `amount` menor o igual a cero, o sin `periodStart`/`periodEnd`
- **THEN** el sistema responde 400 y no crea la inscripción

#### Scenario: Método de pago inválido
- **WHEN** el `initialPayment` viene con un método fuera de `EFECTIVO | QR | TRANSFERENCIA`
- **THEN** el sistema responde 400

### Requirement: Enrollment Date Consistency

El sistema SHALL validar la coherencia de las fechas de una inscripción:

- `startDate` SHALL ser anterior o igual a `endDate`.
- Cuando se envía `durationDays`, `endDate` SHALL calcularse como `startDate + durationDays` y el cliente SHALL poder ignorarlo.

#### Scenario: Fecha de fin anterior a la de inicio
- **WHEN** se crea o actualiza una inscripción con un `startDate` posterior al `endDate` resultante
- **THEN** el sistema responde 400 indicando que la fecha de inicio no puede ser posterior a la de fin

#### Scenario: Inconsistencia detectada por duración
- **WHEN** se envía una `durationDays` negativa o cero
- **THEN** el sistema responde 400

#### Scenario: Fechas coherentes
- **WHEN** se crea una inscripción con duración de 90 días
- **THEN** el sistema persiste `endDate` exactamente 90 días después de `startDate`

### Requirement: Single Active Enrollment

El sistema SHALL permitir **como máximo una inscripción `ACTIVO` por niño**. Un niño no puede estar inscrito dos veces al mismo tiempo.

Esta regla SHALL aplicarse tanto al crear como al pasar a `ACTIVO` una inscripción que no lo estaba.

#### Scenario: Niño ya inscrito
- **WHEN** se intenta crear una inscripción `ACTIVO` para un niño que ya tiene una inscripción `ACTIVO`
- **THEN** el sistema responde 400 indicando que el niño ya tiene una inscripción activa

#### Scenario: Reinscripción sin cerrar la anterior
- **WHEN** se intenta pasar a `ACTIVO` una inscripción de un niño que ya tiene otra `ACTIVO`
- **THEN** el sistema responde 400; la inscripción anterior debe retirarse o pasar a `INACTIVO` primero

#### Scenario: Cerrar y volver a inscribir
- **WHEN** se retira la inscripción activa de un niño y luego se crea una nueva para el mismo niño
- **THEN** la segunda operación se acepta

#### Scenario: Alta de una inscripción no activa con una activa presente
- **WHEN** se crea una inscripción con `status: INACTIVO` para un niño que ya tiene una `ACTIVO`
- **THEN** el sistema la acepta, porque no hay conflicto de inscripción activa

#### Scenario: Actualización que conserva el estado
- **WHEN** se actualiza una inscripción que ya está `ACTIVO` sin cambiar su estado, y es la única activa de su niño
- **THEN** el sistema acepta la operación sin confundirla con un duplicado

### Requirement: Reenrollment Prefill

El sistema SHALL permitir obtener los datos con los que prellenar una reinscripción, tomándolos de la inscripción anterior del mismo niño.

`GET /enrollments/child/:childId/prefill` SHALL devolver la inscripción más reciente del niño y, con ella, los valores sugeridos:

- `monthlyFee` — el monto de la inscripción anterior.
- `startDate` — el `endDate` de la inscripción anterior, para que la reinscripción sea continua.
- `areaIds` — las áreas de la inscripción anterior.
- `scheduleDays` — la agenda de la inscripción anterior.

Los valores SHALL ser **sugerencias editables**: el backend no fuerza ningún valor, solo los devuelve para que el formulario arranque con ellos.

La consulta SHALL devolver 404 si el niño no tiene inscripciones, y el frontend SHALL tratarlo como "sin prefill" en lugar de error.

#### Scenario: Prefill con inscripción anterior
- **WHEN** se consulta el prefill de un niño con al menos una inscripción
- **THEN** el sistema devuelve la inscripción más reciente con `monthlyFee`, `startDate` (su `endDate`), `areaIds` y `scheduleDays` sugeridos

#### Scenario: Niño sin inscripciones
- **WHEN** se consulta el prefill de un niño que nunca fue inscrito
- **THEN** el sistema devuelve 404 y el frontend abre el formulario vacío

#### Scenario: El prefill no impone valores
- **WHEN** el usuario edita el monto o la fecha sugeridos antes de guardar
- **THEN** el sistema guarda los valores editados, no los sugeridos

### Requirement: Enrollment Balance

El sistema SHALL calcular y devolver, por inscripción y por niño, tres cifras:

- `facturado` — `monthlyFee` multiplicado por la cantidad de meses calendario que se solapan con el período `[startDate, endDate ?? hoy]`. Se cuentan los meses desde el mes de `startDate` hasta el mes de `endDate` (o el mes actual si la inscripción sigue `ACTIVO`), ambos inclusive.
- `pagado` — suma de los `amount` de los pagos asociados a esa inscripción.
- `saldo` — `facturado` menos `pagado`. Un saldo positivo indica que el niño debe; uno negativo, que tiene saldo a favor.

El conteo de meses SHALL seguir la misma base que usa `GET /payments/pending`, para que ambas vistas no se contradigan.

Los totales SHALL ser `number` en la respuesta JSON, nunca `string`.

#### Scenario: Inscripción al día
- **WHEN** se consulta una inscripción de un mes con `monthlyFee` 1000 y un pago de 1000
- **THEN** el sistema devuelve `facturado: 1000`, `pagado: 1000`, `saldo: 0`

#### Scenario: Inscripción con deuda
- **WHEN** se consulta una inscripción de dos meses con `monthlyFee` 1000 y un solo pago de 1000
- **THEN** el sistema devuelve `facturado: 2000`, `pagado: 1000`, `saldo: 1000`

#### Scenario: Inscripción retirada
- **WHEN** se consulta una inscripción `RETIRADO` cuyo `endDate` fue en mayo, en septiembre
- **THEN** `facturado` se calcula solo hasta mayo, sin contar meses posteriores a la finalización

#### Scenario: Saldo a favor
- **WHEN** una inscripción tiene pagos por 1500 y `facturado` de 1000
- **THEN** el sistema devuelve `saldo: -500`

#### Scenario: Inscripción sin pagos
- **WHEN** se consulta una inscripción sin pagos asociados
- **THEN** el sistema devuelve `pagado: 0` y `saldo` igual a `facturado`

### Requirement: Enrollment Detail

`GET /enrollments/:id` SHALL devolver el detalle completo de una inscripción: sus datos, niño, áreas, agenda, estado, notas, `startDate`, `endDate`, `durationDays`, y los totales `facturado`, `pagado` y `saldo`, además del historial de pagos asociado ordenado por fecha descendente.

Este endpoint SHALL ser consumible tanto desde la web como desde la credencial, y no SHALL exponer datos de otros niños.

#### Scenario: Detalle con agenda y áreas
- **WHEN** se consulta `GET /enrollments/:id` de una inscripción con agenda, áreas y pagos
- **THEN** el sistema devuelve la inscripción con todo ese contenido y sus totales calculados

#### Scenario: Inscripción inexistente
- **WHEN** se consulta un `id` que no existe
- **THEN** el sistema devuelve 404

#### Scenario: Totales consistentes con el saldo
- **WHEN** se consulta el detalle de una inscripción
- **THEN** el `saldo` devuelto coincide con el `facturado` menos el `pagado` de esa misma respuesta

### Requirement: Enrollment Grouped Listing

`GET /enrollments` SHALL devolver las inscripciones **agrupadas por niño** en un objeto con la estructura:

```json
{
  "groups": [
    {
      "child": { "id": 1, "name": "...", "lastName": "...", "photoUrl": "...", "isActive": true },
      "totals": { "facturado": 3000, "pagado": 2000, "saldo": 1000 },
      "enrollments": [ { "id": 1, "...": "...", "facturado": 1000, "pagado": 1000, "saldo": 0 } ]
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

`totals` del grupo SHALL ser la suma de los totales de sus inscripciones. `meta.total` SHALL contar **niños con al menos una inscripción que coincida con el filtro**, no inscripciones.

El listado SHALL admitir los filtros `search` (coincidencia parcial sobre nombre y apellido del niño), `status` (que incluye en el grupo las inscripciones con ese estado) y `childId`, más `page` y `limit`.

#### Scenario: Agrupación por niño
- **WHEN** se consulta `GET /enrollments` sin filtros
- **THEN** el sistema devuelve un grupo por niño, con la cabecera de totales y sus inscripciones ordenadas de la más reciente a la más antigua

#### Scenario: Totales del grupo
- **WHEN** un niño tiene dos inscripciones con saldos de 500 y -200
- **THEN** el grupo de ese niño declara `saldo: 300`

#### Scenario: Filtro por estado
- **WHEN** se consulta `GET /enrollments?status=RETIRADO`
- **THEN** cada grupo contiene solo las inscripciones `RETIRADO` de su niño, y la cabecera suma únicamente esas

#### Scenario: Búsqueda por nombre
- **WHEN** se consulta `GET /enrollments?search=Gómez`
- **THEN** el sistema devuelve solo los grupos cuyo niño coincide, buscando en nombre y apellido

#### Scenario: Paginación de grupos
- **WHEN** se consulta `GET /enrollments?page=2&limit=10`
- **THEN** el sistema devuelve el segundo bloque de 10 niños y `meta` refleja el total de niños, no de inscripciones

#### Scenario: Un niño sin inscripciones no aparece
- **WHEN** un niño no tiene ninguna inscripción
- **THEN** no aparece en la respuesta, porque el listado es de inscripciones

#### Scenario: Saldos numéricos
- **WHEN** se consulta el listado
- **THEN** `facturado`, `pagado` y `saldo` llegan como números JSON, no como cadenas

### Requirement: Enrollment RBAC

El acceso a los endpoints de inscripciones SHALL cumplir la Permission Matrix de `user-roles` (CRUD para ADMIN y PERSONAL_ADMINISTRATIVO; sin acceso para ESPECIALISTA).

Esta regla SHALL cubrir también el nuevo endpoint de prefill: solo los roles autorizados a crear inscripciones pueden consultar los datos de prefill de un niño.

#### Scenario: Acceso permitido
- **WHEN** un ADMIN o PERSONAL_ADMINISTRATIVO opera sobre inscripciones
- **THEN** la operación se ejecuta normalmente

#### Scenario: Acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta listar, crear, actualizar o pedir el prefill de una inscripción
- **THEN** el sistema devuelve 403 Forbidden

#### Scenario: Listado de inscripciones protegido
- **WHEN** un ESPECIALISTA consulta `GET /enrollments`
- **THEN** el sistema devuelve 403 Forbidden
