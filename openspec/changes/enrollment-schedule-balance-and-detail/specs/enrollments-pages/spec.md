## MODIFIED Requirements

### Requirement: Enrollment Page

La página SHALL estar en `/enrollments` y SHALL estar protegida con permisos de lectura.

- Acceso permitido: ADMIN y PERSONAL_ADMINISTRATIVO; el acceso para ESPECIALISTA será denegado.
- Acceso denegado: cualquier otro rol no autorizado y cualquier usuario no autenticado.

`/enrollments` SHALL ser un **listado agrupado por niño**. Cada grupo muestra la tarjeta del niño (foto, nombre y apellido) como cabecera, y debajo sus inscripciones ordenadas de la más reciente a la más antigua, indicando período (`startDate` → `endDate`), estado, monto mensual, **saldo** y chips de días/turno.

El listado SHALL incluir un buscador por nombre del niño, un filtro por estado y paginación.

`/enrollments` SHALL **no** crear inscripciones. El alta vive únicamente en el expediente del niño.

Cada grupo SHALL mostrar los totales de su niño (`facturado`, `pagado`, `saldo`) y cada inscripción su propio saldo. El saldo SHALL ser visible en la lista, con emphasis visual cuando sea mayor a cero.

#### Scenario: listado agrupado
- **WHEN** se abre `/enrollments` con al menos dos inscripciones de un mismo niño
- **THEN** el niño aparece una sola vez, como cabecera de un grupo, con sus inscripciones debajo

#### Scenario: cabecera con totales
- **WHEN** se visualiza un grupo de un niño con varias inscripciones
- **THEN** la cabecera muestra la suma de facturado, pagado y saldo de ese niño

#### Scenario: saldo visible por inscripción
- **WHEN** una inscripción tiene saldo mayor a cero
- **THEN** el listado muestra ese saldo asociado a la inscripción, no solo el total del grupo

#### Scenario: filtro por estado
- **WHEN** se selecciona un estado en el filtro
- **THEN** cada grupo muestra solo las inscripciones con ese estado, y sus totales se recalculan sobre ese subconjunto

#### Scenario: buscador por nombre
- **WHEN** se escribe un nombre o apellido en el buscador
- **THEN** se muestran solo los grupos cuyo niño coincide con la búsqueda

#### Scenario: acceso denegado a especialistas
- **WHEN** un ESPECIALISTA navega a `/enrollments`
- **THEN** la página deniega el acceso y no lista ninguna inscripción

#### Scenario: el listado no ofrece alta
- **WHEN** se visualiza `/enrollments`
- **THEN** no hay botón ni formulario para crear una inscripción

#### Scenario: sin resultados
- **WHEN** no hay inscripciones que coincidan con los filtros
- **THEN** se muestra un estado vacío indicando que no hay inscripciones

#### Scenario: acceso denegado sin sesión
- **WHEN** se navega a `/enrollments` sin una sesión válida
- **THEN** el usuario es redirigido al login

### Requirement: Payment Form

La página SHALL estar en `/children/[id]/payments` y SHALL estar protegida con permisos de escritura.

El formulario SHALL registrar un pago de una inscripción del niño, con `amount`, `method` (limitado a los métodos vigentes), `periodStart`, `periodEnd` y `notes`.

Al guardar, el sistema SHALL refrescar el saldo de la inscripción correspondiente. El formulario SHALL cerrarse tras un registro exitoso.

#### Scenario: formulario de pago de inscripción
- **WHEN** se abre `/children/[id]/payments`
- **THEN** se muestra un formulario con monto, método de pago, período de cobertura y notas

#### Scenario: métodos de pago vigentes
- **WHEN** se abre el selector de método de pago
- **THEN** solo ofrece `EFECTIVO`, `QR` y `TRANSFERENCIA`

#### Scenario: registro exitoso
- **WHEN** se envía el formulario con monto, método y período válidos
- **THEN** el sistema registra el pago, refresca el saldo de la inscripción y el formulario se cierra

#### Scenario: monto obligatorio
- **WHEN** se envía el formulario sin monto
- **THEN** el sistema rechaza el envío y muestra el error

#### Scenario: validación de período
- **WHEN** se envía un `periodEnd` anterior al `periodStart`
- **THEN** el sistema rechaza el envío indicando que el período no es válido

#### Scenario: acceso denegado a especialistas
- **WHEN** un ESPECIALISTA intenta abrir `/children/[id]/payments`
- **THEN** la página deniega el acceso

### Requirement: Payments Page

La página SHALL estar en `/payments` y SHALL listar todos los pagos registrados, incluidos los asociados a inscripciones.

- Acceso permitido: ADMIN y PERSONAL_ADMINISTRATIVO; el acceso para ESPECIALISTA será denegado.
- Acceso denegado: cualquier otro rol no autorizado y cualquier usuario no autenticado.

Cada pago SHALL mostrar el método, el monto, el período cubierto, la fecha de pago, el niño y la inscripción a la que corresponde.

La página SHALL ofrecer filtros por método de pago y por período.

#### Scenario: listado de pagos
- **WHEN** se abre `/payments`
- **THEN** se listan los pagos registrados, cada uno con su niño y su inscripción

#### Scenario: filtro por método
- **WHEN** se selecciona un método de pago
- **THEN** se muestran solo los pagos con ese método

#### Scenario: pago sin PeriodStart informado
- **WHEN** existe un pago cuyo `PeriodStart` no está informado
- **THEN** se muestra en el listado con un período que indique que no fue informado, sin romper la vista

#### Scenario: acceso denegado a especialistas
- **WHEN** un ESPECIALISTA navega a `/payments`
- **THEN** la página deniega el acceso y no lista ningún pago

#### Scenario: acceso denegado sin sesión
- **WHEN** se navega a `/payments` sin una sesión válida
- **THEN** el usuario es redirigido al login

### Requirement: Children Page

La página SHALL estar en `/children` y SHALL listar los niños registrados con foto, nombre, edad y estado.

- Acceso permitido: ADMIN, PERSONAL_ADMINISTRATIVO y ESPECIALISTA.
- Acceso denegado: cualquier otro rol no autorizado y cualquier usuario no autenticado.

El listado SHALL ofrecer búsqueda por nombre o apellido y filtro por estado.

#### Scenario: listado de niños
- **WHEN** se abre `/children`
- **THEN** cada niño aparece con su foto, nombre, edad y estado

#### Scenario: búsqueda por nombre o apellido
- **WHEN** se escribe un nombre o apellido en el buscador
- **THEN** se muestran solo los niños que coincidan con la búsqueda

#### Scenario: filtro por estado
- **WHEN** se selecciona un estado en el filtro
- **THEN** se muestran solo los niños con ese estado

#### Scenario: acceso denegado sin sesión
- **WHEN** se navega a `/children` sin una sesión válida
- **THEN** el usuario es redirigido al login

## ADDED Requirements

### Requirement: Enrollment Form

El formulario SHALL estar embebido en el expediente del niño (`/children/[id]`) y SHALL estar protegido con permisos de escritura.

- Acceso permitido: ADMIN y PERSONAL_ADMINISTRATIVO; el acceso para ESPECIALISTA será denegado.
- Acceso denegado: cualquier otro rol no autorizado.

El formulario SHALL tener el siguiente orden:

1. **Fecha de inscripción** (`startDate`) — fecha en que se inscribe, que es también el inicio del período de atención.
2. **Duración en días** (`durationDays`) — cantidad de días calendario. La UI calcula y muestra la **fecha de fin** derivada, en solo lectura, para que quien inscribe vea dónde termina la inscripción.
3. **Días y turno** — una fila por día de la semana, con un interruptor para marcar el día y un selector de turno (`TODO_DIA`, `MANANA`, `TARDE`) para los días marcados. Cada día SHALL tener un solo turno, por lo que el selector se muestra únicamente cuando el día está marcado.
4. **Áreas** — selección múltiple desde el catálogo, marcando cuáles aplican.
5. **Monto mensual** (`monthlyFee`) — monto obligatorio y mayor a cero.
6. **Pago inicial** — monto, método (`EFECTIVO | QR | TRANSFERENCIA`) y período de cobertura. Los campos SHALL tener valores precargados desde la inscripción anterior del niño y ser editables.

El formulario **no** SHALL tener selector de niño: la inscripción siempre corresponde al niño del expediente.

Al enviar, el frontend SHALL calcular `endDate` a partir de `startDate + durationDays`, y enviar `scheduleDays` solo con los días marcados y `areaIds` solo con las áreas seleccionadas.

#### Scenario: formulario sin selector de niño
- **WHEN** se abre el alta de inscripción desde el expediente de un niño
- **THEN** el formulario no ofrece elegir otro niño, y el encabezado indica a quién se está inscribing

#### Scenario: la fecha de fin se calcula y se muestra
- **WHEN** se elige una fecha de inscripción y una duración en días
- **THEN** el formulario muestra la fecha de fin resultante, y no permite editarla a mano

#### Scenario: día sin marcar no muestra turno
- **WHEN** un día de la semana está sin marcar
- **THEN** su selector de turno aparece deshabilitado u oculto, y no se envía

#### Scenario: un solo turno por día
- **WHEN** un día está marcado
- **THEN** se elige un único turno de entre `TODO_DIA`, `MANANA` y `TARDE`

#### Scenario: selección de áreas
- **WHEN** se abren las áreas
- **THEN** se listan las áreas activas del catálogo como opciones marcables, y solo se envían las seleccionadas

#### Scenario: monto obligatorio
- **WHEN** se intenta enviar sin monto, o con monto cero
- **THEN** el formulario muestra el error y no envía

#### Scenario: prefill de una inscripción anterior
- **WHEN** se abre el alta para un niño que ya tiene una inscripción
- **THEN** el monto y la fecha vienen precargados desde la inscripción anterior, y son editables

#### Scenario: prefill a partir del endDate anterior
- **WHEN** el prefill propone una fecha
- **THEN** esa fecha corresponde al final de la inscripción anterior, de modo que la nueva inscripción continúe desde ahí

#### Scenario: no se cierra la inscripción anterior
- **WHEN** se inscribe de nuevo a un niño sin haber cerrado su inscripción anterior
- **THEN** el sistema lo advierte, pero no cierra la anterior automáticamente

#### Scenario: día no seleccionado no se envía
- **WHEN** se envía el formulario con solo dos días marcados de los siete
- **THEN** el payload incluye únicamente esos dos días, con su turno

### Requirement: Enrollment Detail Page

La página SHALL estar en `/enrollments/[id]` y SHALL estar protegida con permisos de lectura.

- Acceso permitido: ADMIN y PERSONAL_ADMINISTRATIVO; el acceso para ESPECIALISTA será denegado.
- Acceso denegado: cualquier usuario no autenticado.

La página SHALL mostrar:

- Datos de la inscripción: estado, período (`startDate` → `endDate`), duración en días, notas.
- Niño al que corresponde, con enlace a su expediente.
- Áreas asociadas, identificando las que estén inactivas.
- Agenda semanal, agrupada por turno, con los días de cada turno.
- Totales: `facturado`, `pagado` y `saldo`, con emphasis cuando el saldo sea mayor a cero.
- Historial de pagos de la inscripción, ordenado de más reciente a más antiguo, con método, monto y período.

#### Scenario: detalle completo
- **WHEN** se abre `/enrollments/[id]` de una inscripción con agenda, áreas y pagos
- **THEN** la página muestra los datos, la agenda agrupada por turno, las áreas, los totales y el historial de pagos

#### Scenario: saldo pendiente destacado
- **WHEN** la inscripción tiene saldo mayor a cero
- **THEN** la página destaca ese saldo de forma visible

#### Scenario: navegación al expediente
- **WHEN** se visualiza una inscripción
- **THEN** el nombre del niño enlaza a su expediente

#### Scenario: inscripción inexistente
- **WHEN** se navega a `/enrollments/[id]` con un id que no existe
- **THEN** se muestra un mensaje de que no se encontró la inscripción, y no una pantalla de error

#### Scenario: acceso denegado sin sesión
- **WHEN** se navega a `/enrollments/[id]` sin una sesión válida
- **THEN** el usuario es redirigido al login