## MODIFIED Requirements

### Requirement: Enrollments List

El frontend SHALL mostrar el listado de inscripciones agrupado por niño, consumiendo `GET /enrollments`. SHALL incluir filtro por estado, buscador y estados de carga/vacío/error.

Cada inscripción SHALL mostrar su tipo, fechas, **monto de inscripción**, **total pagado** y **saldo pendiente**, además del estado. La interfaz NO SHALL usar los términos "Facturación", "Facturado" ni "Módulo de facturación".

#### Scenario: Listado cargado
- **WHEN** un usuario con permiso abre `/enrollments`
- **THEN** se muestran las inscripciones agrupadas por niño con su tipo, monto, total pagado y saldo pendiente

#### Scenario: Resaltado del saldo
- **WHEN** una inscripción tiene saldo pendiente mayor a cero
- **THEN** la UI lo resalta visualmente

#### Scenario: Sin "facturación" en la interfaz
- **WHEN** el usuario navega por las pantallas de inscripciones
- **THEN** no encuentra los términos "Facturación" ni "Facturado"

### Requirement: Enrollment Creation

El frontend SHALL ofrecer un formulario de inscripción con:

- **Tipo de inscripción** (Mensual, Trimestral, Semestral, Anual). Obligatorio.
- **Fecha de inicio**. Obligatoria.
- **Duración** y **fecha de finalización** calculadas automáticamente en solo lectura.
- **Monto de inscripción**, editable y obligatorio, mayor a cero.
- Agenda, áreas y notas.
- **Registrar pago inicial** opcional, con monto, fecha, método y **período correspondiente**.

El formulario SHALL validarse con zod y SHALL impedir montos negativos o cero. Al enviar, llama a `POST /enrollments` y refresca el listado.

Cuando el pago inicial corresponda a una inscripción trimestral, semestral o anual, SHALL cubrir el período completo de la inscripción, no solo el primer mes. El pago inicial NO SHALL superar el saldo de la inscripción salvo que exista explícitamente una funcionalidad de pagos adelantados.

#### Scenario: Inscripción exitosa
- **WHEN** el usuario completa tipo, fecha, monto y guarda
- **THEN** se crea la inscripción (201) y el perfil/listado se refresca con toast de éxito

#### Scenario: Duración calculada automáticamente
- **WHEN** el usuario selecciona el tipo Trimestral
- **THEN** la UI muestra 90 días y la fecha de finalización calculada, sin permitir editarlas

#### Scenario: Monto inválido
- **WHEN** el monto no se ingresa o es menor o igual a cero
- **THEN** el formulario muestra error y no se envía

#### Scenario: Pago inicial mayor al saldo
- **WHEN** el usuario intenta un pago inicial mayor al monto de la inscripción
- **THEN** la UI muestra un error y no permite confirmar

#### Scenario: Pago inicial cubre todo el período
- **WHEN** se registra un pago inicial para una inscripción trimestral
- **THEN** el período del pago cubre los 90 días de la inscripción

### Requirement: Enrollments Status Change

La UI SHALL permitir cambiar el estado de una inscripción (ACTIVO/INACTIVO/RETIRADO) mediante `PATCH /enrollments/:id` con confirmación previa, mostrando el `endDate` asignado automáticamente cuando el estado deja de ser ACTIVO.

#### Scenario: Cambio de estado
- **WHEN** el usuario cambia el estado de una inscripción y confirma
- **THEN** se actualiza el estado y el listado refleja el nuevo badge

#### Scenario: Cancelación de la confirmación
- **WHEN** el usuario cancela la confirmación de cambio de estado
- **THEN** no se llama a la API y el estado permanece

## ADDED Requirements

### Requirement: Enrollment Type UI

El formulario SHALL presentar los tipos de inscripción con etiquetas comprensibles para el personal administrativo (Mensual, Trimestral, Semestral, Anual) y NO SHALL pedir días ni fecha de fin al usuario.

#### Scenario: Selección de tipo
- **WHEN** el usuario abre el formulario de nueva inscripción
- **THEN** puede elegir el tipo entre Mensual, Trimestral, Semestral y Anual

#### Scenario: Sin entrada de días
- **WHEN** el usuario completa el formulario
- **THEN** no existe un campo editable de duración en días

### Requirement: Active Enrollment Summary

El perfil del niño SHALL mostrar claramente, para la inscripción vigente:

- Tipo de inscripción activa.
- Fecha de inicio y de finalización.
- Monto personalizado.
- Total pagado.
- Saldo pendiente.

La UI SHALL usar el término "Inscripción activa" para la inscripción vigente.

#### Scenario: Resumen visible
- **WHEN** se abre el expediente de un niño con inscripción vigente
- **THEN** se muestra su tipo, fechas, monto, total pagado y saldo pendiente

#### Scenario: Sin inscripción vigente
- **WHEN** el niño no tiene inscripción vigente
- **THEN** la UI lo indica y ofrece crear una nueva

### Requirement: Reenrollment Action

El perfil del niño SHALL ofrecer una acción clara "Reinscribir" o "Nueva inscripción". Al abrirla, el formulario SHALL reutilizar los datos convenientes de la inscripción anterior (tipo, monto, áreas y agenda) como valores iniciales editables, y SHALL sugerir como fecha de inicio el día siguiente al fin de la inscripción anterior.

El usuario SHALL poder revisar fechas y monto antes de confirmar. La reinscripción NO SHALL eliminar deudas ni pagos anteriores.

#### Scenario: Precarga editable
- **WHEN** el usuario abre "Reinscribir" en un niño con inscripción anterior
- **THEN** el formulario aparece con el tipo, monto, áreas y agenda anteriores y la fecha sugerida, todos editables

#### Scenario: Confirmación de la reinscripción
- **WHEN** el usuario revisa y confirma
- **THEN** se crea una nueva inscripción con su propia obligación económica

#### Scenario: Historial conservado
- **WHEN** se completa la reinscripción
- **THEN** las inscripciones anteriores y sus pagos siguen visibles

### Requirement: Previous Debts Display

El perfil del niño SHALL mostrar por separado las deudas pendientes de inscripciones anteriores y el saldo pendiente de la inscripción vigente, usando los términos "Deudas anteriores" y "Saldo pendiente".

#### Scenario: Deudas anteriores visibles
- **WHEN** el niño tiene una inscripción anterior con saldo pendiente
- **THEN** la UI la muestra aparte de la inscripción vigente con su monto, total pagado y saldo pendiente

#### Scenario: Sin deudas anteriores
- **WHEN** no hay inscripciones anteriores con saldo
- **THEN** la UI no muestra la sección de deudas anteriores
