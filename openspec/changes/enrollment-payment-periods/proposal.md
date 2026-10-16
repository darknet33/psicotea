## Why

El módulo de inscripciones y pagos quedó a mitad de camino y no refleja cómo opera el centro:

1. **El monto es mensual y se multiplica por mes.** `Enrollment.monthlyFee` se interpreta como "cuota por mes" y el saldo se calcula como `monthlyFee × meses`. El centro cobra un **monto único por período** (una inscripción trimestral de Bs 2.400 son Bs 2.400, no Bs 7.200), y cada niño puede pagar un monto distinto.
2. **La duración se escribe a mano en días.** El personal no debería calcular ni teclear "90"; debería elegir "Trimestral" y que el sistema derive la duración y la fecha de fin.
3. **No existe una inscripción "activa" por rango de fechas.** Hay "una sola `ACTIVO` por niño" como regla de estado, pero el concepto operativo es "vigente hoy, entre `startDate` y `endDate` inclusive". Además se permiten inscripciones con fechas solapadas.
4. **El pago no se aplica a la inscripción.** `Payment.enrollmentId` es opcional y el formulario no lo envía; no se puede cobrar la deuda de una inscripción anterior, ni un pago que cubra varias obligaciones. No hay trazabilidad de qué obligación paga cada peso.
5. **La interfaz habla de "facturación".** El personal administrativo no factura: registra inscripciones, cobra y consulta saldos. Los términos "Facturado"/"Facturación" no corresponden a su trabajo.
6. **El formulario confunde fecha de pago con período.** En `payment-form.tsx` la fecha inicial del período se usa como final (`periodEnd`), y el pago siempre se aplica al mes actual, aunque el dinero se reciba después.

Este change reescribe el modelo económico de las inscripciones alrededor de tres ideas: **monto personalizado por inscripción**, **el monto corresponde al período completo** y **cada pago queda aplicado a la obligación que salda**.

## What Changes

### Modelo de datos

- **BREAKING** `Enrollment.monthlyFee` pasa a `Enrollment.amount`: el monto **total de la inscripción para su período**, no una cuota mensual. Se migra el valor histórico (`amount = monthlyFee`) y se preserva.
- `Enrollment` gana `type` (`EnrollmentType` = `MENSUAL | TRIMESTRAL | SEMESTRAL | ANUAL`). `durationDays` pasa a derivarse del tipo en el backend (`30 | 90 | 180 | 360`); ya no lo introduce el usuario.
- Nueva tabla `PaymentAllocation`: parte de un `Payment` aplicada a una `Enrollment`. Un pago puede cubrir **varias** obligaciones y conserva su movimiento original. `Payment.enrollmentId` se mantiene como "inscripción principal" opcional (compatibilidad) pero la fuente de verdad de la aplicación pasa a ser `PaymentAllocation`.
- `Payment` conserva `paymentDate` (cuándo se recibió el dinero) y `periodStart`/`periodEnd` (a qué período corresponde), con semántica explícita y sin mezclarse.

### Backend

- **Alta de inscripción** (`POST /enrollments`): recibe `type`, `startDate`, `amount`, agenda, áreas, notas y `initialPayment` opcional. El backend deriva `durationDays` y `endDate` del tipo. `amount` debe ser > 0.
- **Edición** (`PATCH /enrollments/:id`): permite cambiar `type`, `startDate`, `amount` y recalcula `endDate`.
- **Reinscripción**: `GET /enrollments/child/:childId/prefill` propone el `type`, el `amount`, las áreas y la agenda de la inscripción anterior; la fecha sugerida es el día siguiente al `endDate` anterior. Son sugerencias editables y **no** cierran ni eliminan nada.
- **Prevención de solapamiento**: no se puede crear/editar una inscripción cuyas fechas se solapen con otra del mismo niño (independiente del estado).
- **Inscripción vigente**: se considera activa si `startDate <= hoy <= endDate`. El detalle y el listado exponen esa condición.
- **Pagos** (`POST /payments`): recibe `enrollmentId` (o una lista de aplicaciones), `paymentDate`, `periodStart`/`periodEnd`, `method`, `amount`. La aplicación del pago a una o varias inscripciones se hace en una **transacción**. Si no se especifica destino, se aplica primero a la **deuda más antigua**.
- **Totales**: por inscripción, `total = amount`, `pagado = Σ PaymentAllocation.amount de esa inscripción`, `saldo = total − pagado`. **Ya no se multiplica el monto por meses.** `facturado` desaparece como concepto de API.
- **Deudas**: endpoint de deudas que separa "deudas anteriores" de la "inscripción vigente" por niño, calculadas con datos reales.
- **Duración y montos**: se usan `Decimal(10,2)`; los cálculos se hacen con aritmética de enteros de centavos en el servicio para evitar errores de punto flotante.

### Frontend

- **Lenguaje de interfaz**: se elimina "Facturación/Facturado/Módulo de facturación". Se usa: Inscripción activa, Nueva inscripción, Reinscribir, Tipo de inscripción, Monto de inscripción, Fecha de inicio, Fecha de finalización, Período correspondiente, Registrar pago, Historial de pagos, Total de la inscripción, Total pagado, Saldo pendiente, Deudas anteriores.
- **Formulario de inscripción**: selector de tipo (Mensual/Trimestral/Semestral/Anual) con duración y fecha de fin calculadas en solo lectura; monto editable y obligatorio; pago inicial opcional con monto, fecha, método y período que cubre **todo** el período de la inscripción.
- **Formulario de pago**: selección de niño, de la obligación (inscripción activa o deuda anterior) y fecha real de pago independiente del período cubierto. Corrige el bug que usa la fecha inicial como final.
- **Perfil del niño**: resumen económico por inscripción (monto, pagado, saldo), inscripción vigente destacada, deudas anteriores separadas, acción "Reinscribir" e historial de pagos agrupado por inscripción y período.
- Se distinguen visualmente los pagos normales, los atrasados (pagados después del período) y los distribuidos entre varias obligaciones.

### Documentación

- `project.md` §5, §6 y §13 se actualizan: monto personalizado por período, tipos, inscripción vigente, aplicación de pagos y deudas anteriores.

## Capabilities

### New Capabilities

- `payment-allocations`: entidad intermedia que aplica un pago a una o varias inscripciones, con reglas de reparto, aplicación por defecto a la deuda más antigua y trazabilidad del movimiento original.

### Modified Capabilities

- `enrollments`: tipo de inscripción y duración derivada, monto único del período (`amount`), vigencia por rango de fechas, prevención de solapamiento, prefill de reinscripción, total/saldo sin multiplicar por meses.
- `payments`: pago ligado a la inscripción, separación entre fecha de pago y período cubierto, registro con aplicación a una o varias obligaciones y cálculo de deudas.
- `enrollments-pages`: formulario de inscripción con tipo y monto del período, reinscripción desde el perfil, resumen económico y lenguaje sin "facturación".
- `payments-pages`: registro de pago con destino editable, historial agrupado por inscripción/período, distinción de pagos atrasados y distribuidos.

## Impact

- **Base de datos**: rename de columna `Enrollment.monthlyFee → amount`; nueva columna `Enrollment.type`; nueva tabla `PaymentAllocation`; nueva enumeración `EnrollmentType`. Migración con backfill (`amount = monthlyFee`) y documentación de registros ambiguos (`type` inferido o `NULL` para revisión). **No se elimina ninguna columna hasta verificar la migración.**
- **Backend**: `enrollments.service.ts` y `payments.service.ts` reescritos en su lógica económica; nuevos DTOs (`enrollment-type`, `payment-allocation`); `children.service.ts` deja de exponer pagos sueltos y pasa a exponer el resumen por inscripción.
- **Frontend**: `enrollment-form.tsx` y `payment-form.tsx` reescritos; `children/[id]/page.tsx`, `enrollments/page.tsx`, `enrollments/[id]/page.tsx`, `payments/page.tsx` y `payments/pending/page.tsx` actualizados; `types/enrollment.ts`, `types/payment.ts`, `lib/api/enrollments.ts` y `lib/api/payments.ts` ampliados.
- **Consumidores de `facturado`**: el dashboard y el listado de inscripciones muestran `facturado`; se reemplaza por `total`/`pagado`/`saldo`.
- **Dependencias**: ninguna nueva.
- **Datos existentes**: los montos históricos se preservan. Las inscripciones sin `type` reconocible quedan marcadas para revisión; no se convierten silenciosamente.
