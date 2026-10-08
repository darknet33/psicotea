## Why

La inscripción actual es un registro casi vacío: `startDate`, `endDate`, `status`, `monthlyFee` y `notes`. Eso no alcanza para operar un centro. En la práctica faltan cinco cosas:

1. **No hay agenda.** No se sabe qué días asiste el niño ni en qué turno. El personal lo anota en papel.
2. **No hay áreas.** Ver `enrollment-area-catalog`.
3. **No hay saldo.** `getPendingPayments` calcula meses impagados al vuelo y nada más; no existe una cifra de "cuánto debe este niño" visible en la inscripción ni en el listado.
4. **No se puede editar.** Lo único mutable desde la UI es el estado, con un `<select>`.
5. **No hay detalle.** `GET /enrollments/:id` existe en el backend y el cliente del frontend lo expone, pero **ninguna ruta lo consume**: es código muerto. El alta solo se puede hacer desde el expediente, sin poder ver los pagos de una inscripción.

Además `/enrollments` es una tabla plana de 173 líneas sin agrupar: con 40 niños el personal tiene que leer fila por fila para saber quién debe qué.

Este change rediseña la inscripción alrededor de la operación real del centro, manteniendo el alta anclada al expediente del niño.

## What Changes

### Modelo de datos

- **BREAKING** `PaymentMethod` pasa a `EFECTIVO | QR | TRANSFERENCIA`. Se agregan `QR` y se retiran `TARJETA` y `CHEQUE`, con backfill `TARJETA → TRANSFERENCIA` y `CHEQUE → EFECTIVO`. Refleja cómo cobra el centro. Toca `PaymentMethod` en la spec `payments`, `payment-form.tsx` y `types/payment.ts`.
- Nueva tabla `EnrollmentScheduleDay`: día de la semana con su propio turno (`Shift` = `TODO_DIA | MANANA | TARDE`), con `@@unique([enrollmentId, dayOfWeek])`. No se puede marcar dos veces el mismo día con turnos distintos.
- `Enrollment` gana `durationDays Int?`. `endDate` **se sigue calculando y persistiendo** (`startDate + durationDays`) para no romper `getPendingPayments` ni la spec de pagos.
- `EnrollmentArea` (de `enrollment-area-catalog`) pasa a ser un campo opcional de la inscripción.
- `Enrollment.childId` queda inmutable tras crear (se documenta; el DTO deja de aceptarlo).

### Backend

- **`POST /enrollments`** en una sola transacción: inscripción + días de agenda + áreas + pago inicial. Acepta `startDate` (etiquetada "Fecha de inscripción"), `durationDays`, `monthlyFee`, `scheduleDays[]`, `areaIds[]`, `initialPayment` (monto + método + periodo) y `notes`.
- **`GET /enrollments`** cambia de forma: de array plano a agrupación por niño, con cabecera de totales (`facturado`, `pagado`, `saldo`) y sus inscripciones debajo, cada una con su propio saldo. La paginación cuenta grupos (niños), no inscripciones. Es **BREAKING** para los consumidores del frontend.
- **`GET /enrollments/:id`** pasa a devolver el detalle completo: áreas, agenda, pagos y totales calculados. Deja de ser código muerto.
- **`PATCH /enrollments/:id`** acepta la agenda y las áreas (reemplazo completo de ambos conjuntos), `durationDays`, `monthlyFee`, fechas y notas. Ya **no** acepta `childId`.
- Reglas de integridad en el service: máximo una inscripción `ACTIVO` por niño, y `startDate <= endDate`.
- Saldo calculado al vuelo: `facturado = monthlyFee × meses que solapan [startDate, endDate ?? hoy]`, `pagado = Σ Payment.amount` de esa inscripción, `saldo = facturado − pagado`.
- **BREAKING** `Decimal` se serializa a `number` en las respuestas de inscripciones y pagos. Hoy Prisma devuelve `"150"` (string) y el frontend declara `number`; el dashboard ya suma esos strings.

### Frontend

- El alta de inscripción **sigue en el expediente del niño** y el selector de niño desaparece del formulario: siempre es el niño del expediente.
- `enrollment-form.tsx` se reconstruye con el orden pedido: fecha de inscripción → duración en días → días y turno → áreas → monto → pago inicial.
- **Prefill de reinscripción**: al abrir el alta en un niño con inscripción anterior, el monto y la fecha se prellenan desde ella. La fecha se propone como el `endDate` de la anterior, para que la reinscripción sea continua. Ambos valores son editables. **No** se cierra la inscripción anterior automáticamente.
- El expediente muestra cada inscripción como tarjeta con chips de día/turno, áreas y saldo, con enlace al detalle.
- Nueva ruta `/enrollments/[id]` con el detalle, los pagos y el historial.
- `/enrollments` deja de crear y pasa a ser el listado agrupado por niño, con buscador y filtro por estado.
- `payment-form.tsx` y `types/payment.ts` actualizados al enum nuevo.

### Documentación

- `project.md` §5 se reescribe: hoy no menciona duración, agenda, áreas ni saldo.

## Capabilities

### New Capabilities

Ninguna. `EnrollmentScheduleDay` y el cálculo de saldo son parte de la capability `enrollments`, y la página de detalle/editación de `enrollments-pages`.

### Modified Capabilities
- `enrollments`: alta con duración, agenda, áreas y pago inicial; detalle real; edición; forma de la respuesta agrupada; reglas de integridad; inmutabilidad de `childId`; serialización de `Decimal`.
- `enrollments-pages`: listado agrupado por niño sin alta, prefill de reinscripción, editor de agenda, selector de áreas, página de detalle y edición.
- `payments`: enum `PaymentMethod` a `EFECTIVO | QR | TRANSFERENCIA`.

## Impact

- **Base de datos**: tablas `EnrollmentScheduleDay` y `Shift`; columna `Enrollment.durationDays`; enumeración `PaymentMethod` reescrita con backfill de datos. Es la migración más delicada del proyecto: ver `design.md`, sección de migración.
- **Backend**: `enrollments.service.ts` crece de 134 a ~300 líneas; nuevos DTOs (`schedule-day.dto.ts`, `initial-payment.dto.ts`, `enrollment-query.dto.ts`); `payments` adaptado al enum; helper de serialización de `Decimal`.
- **Frontend**: `enrollment-form.tsx` se reescribe; `enrollments/page.tsx` se reescribe como listado agrupado; nuevo `enrollments/[id]/page.tsx`; `types/enrollment.ts` y `lib/api/enrollments.ts` ampliados; `payment-form.tsx` y `types/payment.ts` actualizados.
- **Consumidores de `GET /enrollments`**: exactamente dos, `enrollments/page.tsx:45` y `dashboard/page.tsx:68`. La forma agrupada obliga a actualizarlos; es trabajo acotado.
- **Dependencias**: ninguna nueva.
- **`getPendingPayments`**: se conserva sin cambios, sigue usando `startDate`/`monthlyFee`/`payments`. No se toca.
- **Riesgo de datos**: el backfill de `PaymentMethod` reetiqueta pagos históricos. Si el centro usaba `TARJETA` o `CHEQUE` de forma habitual, la etiqueta cambia a `TRANSFERENCIA`/`EFECTIVO`. El monto, la fecha y el periodo no se tocan.
