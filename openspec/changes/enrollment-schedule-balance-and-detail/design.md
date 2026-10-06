## Context

`enrollments.service.ts` tiene 134 líneas y expone 5 métodos. `getPendingPayments` ya contiene el grueso de la lógica de facturación mes a mes, pero vive aislado: solo lo usa `payments.service.ts` para un reporte. La inscripción en sí no tiene agenda, ni áreas, ni saldo calculado.

Dos restricciones del proyecto condicionan el diseño:

- **`Decimal` como string.** Prisma devuelve `Decimal` de MySQL como objeto serializado a string. Los DTOs de TypeScript declaran `number`. El dashboard ya suma esos valores como si fueran números. Cualquier cifra nueva que se exponga en la UI tiene que corregir esto primero o nasce rota.
- **Un solo consumidor de verdad.** `GET /enrollments` tiene exactamente dos llamadores: `enrollments/page.tsx:45` y `dashboard/page.tsx:68`. Cambiar la forma de la respuesta obliga a tocar dos archivos, no diez.

El frontend construye la fecha de fin en el cliente (`formData.set("endDate", endDate.toISOString().split("T")[0])`, `enrollment-form.tsx:44`), lo que significa que la regla de negocio ya está duplicada del lado equivocado. Este change la mueve al backend.

## Goals / Non-Goals

**Goals:**

- Agenda semanal por día con turno propio, persistida y editable.
- Saldo (`facturado` / `pagado` / `saldo`) calculado por inscripción y por niño, numérico en JSON.
- Alta transaccional: inscripción + agenda + áreas + pago inicial, o nada.
- Detalle de inscripción real y consumible, con pago inicial incluido en el mismo flujo.
- Listado agrupado por niño, paginado por niños.
- Reglas de integridad en el backend: un `ACTIVO` por niño, `startDate <= endDate`, un turno por día.
- Mover el cálculo de `endDate` desde el frontend al backend.
- `Decimal` serializado como número.

**Non-Goals:**

- La asistencia diaria: la agenda es informativa, no habilita registro de asistencia.
- Un registro histórico de cambios de la inscripción (sin bitácora de quién editó qué).
- Recalcular o cobrar automáticamente saldos vencidos.
- Migrar las 173 inscripciones existentes a `durationDays`: el campo es nullable.
- Permitir varias inscripciones `ACTIVO` por niño. La regla es de una sola.
- Detalle o listado de pagos por área.

## Decisions

### D1: `endDate` derivado y persistido, `durationDays` nullable

`durationDays` es la entrada del usuario; `endDate = startDate + durationDays` se calcula en el backend y se persiste igual. `durationDays` es `Int?` porque las 173 inscripciones existentes no lo tienen y no se van a inventar.

Se persiste `endDate` en lugar de derivarlo siempre en la consulta porque `getPendingPayments` y el reporte de pagos lo leen directamente, y porque el filtro por rango de fechas necesita índices sobre columnas reales.

- Alternativa considerada: borrar `endDate` y calcularlo siempre. Rechazada: rompe `getPendingPayments`, los reportes y los índices.
- Alternativa considerada: guardar solo `durationDays`. Rechazada por lo mismo.
- Alternativa considerada: hacer `durationDays` obligatorio y hacer backfill calculándolo desde las fechas existentes. Atractiva, pero mezcla dos cosas: el backfill de `durationDays` es de una vez, mientras que hacer el campo obligatorio obliga a que toda llamada futura lo enviaría y no aporta. Se prefiere nullable y un fallback en el service.

**Consecuencia en el service:** cuando `durationDays` viene ennull, se usa `endDate` explícito (comportamiento actual). Cuando viene, `endDate` se ignora y se recalcula. El `endDate` explícito se conserva para el endpoint de pagos y para el frontend legacy.

### D2: La regla de un `ACTIVO` se aplica en el service, no con un índice único

MySQL no tiene índices únicos parciales, así que "como máximo un `ACTIVO` por niño" no se puede expresar con `@@unique`. Se valida en el service dentro de la transacción.

- Alternativa considerada: columna generated `activeChildId` con `UNIQUE`, calculada como `CASE WHEN status = 'ACTIVO' THEN childId ELSE NULL END`. MySQL **sí** permite múltiples `NULL` en un índice único, así que la restricción funcionaría a nivel de base. Es la opción más robusta, pero agrega una columna generada que Prisma no modela y que hay que mantener sincronizada a mano con cada cambio de estado; el costo de mantenimiento no compensa para un centro con dos personas que cargan datos.
- Alternativa considerada: `SERIALIZABLE` en la transacción. Descartada: agrega contención y reintentos para cubrir una carrera que en la práctica requiere dos inscriptions simultáneas del mismo niño desde el mismo formulario.

Se acepta la brecha teórica: dos peticiones concurrentes podrían superar la comprobación. Se mitiga con la verificación posterior dentro de la misma transacción y documentando la limitación.

### D3: La agenda se guarda en tabla propia, no como JSON ni como columnas `lunes`, `martes`

`EnrollmentScheduleDay` con `@@unique([enrollmentId, dayOfWeek])` es la opción normalizada. La alternativa de columnas booleanas por día (`lunesTurno Shift?`) se descartó porque hace que cada consulta, cada formulario y cada serialización del listado tenga que manejar 7 campos opcionales, y no permite recorrer días en orden sin una lista explícita.

La alternativa JSON (`schedule Json`) se descartó por la misma razón de portabilidad: no se puede filtrar ni agregar en SQL, y el filtro por turno no está en alcance ahora pero sería el siguiente pedido natural.

### D4: Saldo calculado al vuelo, no columna persistida

`facturado`, `pagado` y `saldo` se calculan en el service a partir de `monthlyFee`, fechas y pagos. No se agrega columna `balance` a `Enrollment`.

Motivo: un saldo persistido se desincroniza en cuanto se registra, edita o anula un pago, y cada uno de esos caminos necesita una actualización más. El costo del cálculo en vuelo es despreciable: es aritmética sobre los registros que ya se están cargando para el listado. El listado agrupado ya trae todas las inscripciones del grupo, así que la suma es local.

- Alternativa considerada: columna `balance` mantenida por triggers. Rechazada: los triggers ocultan lógica de negocio fuera del código TypeScript y complican los tests.
- Alternativa considerada: vistamaterializada. Rechazada: `MySQL` no las tiene y no compensa a esta escala.

El conteo de meses se **extrae del cálculo existente en `getPendingPayments`** para que ambas vistas no se contradigan. Es la razón principal por la que el saldo se calcula aquí y no en el frontend.

### D5: `Decimal` se convierte a `number` en el borde del controller

Un interceptor global `@Transform` de `class-transformer` convierte cualquier `Decimal` a `number` en la respuesta. Se aplica a `enrollments` y `payments`.

- Alternativa considerada: serializar en cada DTO a mano. Rechazada: se olvida en algún método y el bug reaparece.
- Alternativa considerada: cambiar el schema a `Float`. Rechazada: `Float` en Prisma/MySQL es `double`, y para dinero eso es exactamente lo que no se quiere.

El interceptor es la opción de menor resistencia porque cubre también los objetos anidados (pagos dentro de una inscripción) sin que cada endpoint tenga que acordarse.

Nota: esto **cambia el tipo real** de lo que ya llegaba como string. El dashboard lo suma con `+` sobre un string, lo que concatenaba. Al pasar a número, el dashboard empieza a calcular bien; hay que verificarlo.

### D6: El pago inicial reutiliza la lógica de pagos, dentro de la transacción

`initialPayment` acepta `{ amount, method, periodStart, periodEnd, reference?, description? }`, la misma forma de `CreatePaymentDto`. El service construye el registro con el `enrollmentId` de la inscripción recién creada.

No se llama a `payments.service.ts` desde `enrollments.service.ts`: dos servicios no comparten transacción así. Se extrae la **validación** (monto > 0, período coherente, método válido, inscripción existente) a una función compartida, y cada servicio la usa dentro de su propia transacción. La validación de "la inscripción existe" no aplica al pago inicial porque la inscripción se está creando en la misma transacción.

El pago inicial es **opcional en el endpoint**: el frontend lo exige, pero el backend lo acepta ausente porque el cobro puede quedar pendiente de acordar y bloquear el alta sería unhelpful.

### D7: `POST /enrollments` conserva `childId` en el payload

Aunque la UI ya no ofrece selector de niño, el endpoint sigue exigiendo `childId`. El backend no tiene contexto de ruta desde `/children/[id]` porque es una API separada: el frontend lo pasa desde la página del expediente.

Mantenerlo en el endpoint evita un endpoint separado `/children/:id/enrollments` que sería idéntico salvo por dónde lee el id. Un solo camino de alta es más barato de mantener que dos coherentes.

### D8: La forma agrupada devuelve un objeto con `groups` y `meta`

La respuesta pasa de array plano a `{ groups, meta }`. `meta.total` cuenta niños. El shape incluye el niño en cada grupo para que el frontend no haga N+1 por niños.

- Alternativa considerada: devolver el array plano y agrupar en el frontend. Rechazada: el frontend necesita los totales por grupo, y calcularlos en el cliente significa traer todas las inscripciones, no solo la página.
- Alternativa considerada: dos endpoints (`/enrollments` plano + `/enrollments/summary` agregado). Rechazada: duplica la consulta y obliga a dosLoading states.

`dashboard/page.tsx` consume el endpoint y recibe la forma nueva; se adapta para usar solo lo que necesita.

### D9: DTOs con `class-validator`, sin dependencias nuevas

Los DTOs nuevos (`ScheduleDayDto`, `InitialPaymentDto`, `QueryEnrollmentsDto`) usan `@nestjs/class-validator` y `@nestjs/class-transformer`, ya presentes. Para `QueryEnrollmentsDto` hay que declarar `@Type(() => Number)` en `page` y `limit` porque el `ValidationPipe` con `transform` deja los query params como string y "2" > 10 es truthy.

## Risks / Trade-offs

- **La forma agrupada rompe consumidores** → Exactamente dos archivos los usan. Riesgo contenido, pero ambos hay que adaptarlos en el mismo change y probar el dashboard además del listado.
- **El backfill de `PaymentMethod` reetiqueta pagos históricos** → Un pago que era `TARJETA` pasa a leerse `TRANSFERENCIA`. Montos, fechas y períodos no se tocan. Si el centro distingue bancar movements, se pierde ese matiz. Mitigación: el backfill es explícito y documentado, y se verifica con un `SELECT` de conteo por método antes y después.
- **Cambio de tipo en `Decimal` puede romper algo que hoy "funciona por casualidad"** → El dashboard concatenaba strings. Al volverse número, ese bug se.visible, pero no hay ningún consumidor que dependa del comportamiento roto. Mitigación: convertir solo en los controladores de `enrollments` y `payments`, revisar con `tsc` y probar el dashboard.
- **`durationDays` nullable permite dos fuentes de verdad** → Si alguien manda `startDate`, `endDate` y `durationDays` inconsistentes, manda `durationDays`. Se documenta la precedencia y el service normaliza el payload antes de escribir, dejando un único camino válido.
- **La regla de un `ACTIVO` tiene una brecha teórica de carrera** → Aceptado por D2. Mitigación: la validación está dentro de la transacción y hay un test que cubre el caso secuencial (el que ocurre en la realidad).
- **`getPendingPayments` y el saldo pueden divergir con el tiempo** → Hoy comparten la función de conteo de meses (D4). Si divergen, el bug está en una sola función. Se añade un test que compara ambas salidas para la misma inscripción.
- **Más queries por el listado agrupado** → Para obtener los saldos de todas las inscripciones de los niños de la página actual, hace falta una segunda consulta por `childId IN (...)`. Son 2 queries, no N+1. Aceptable a esta escala.

## Migration Plan

Orden importante: la migración de `PaymentMethod` y la de la agenda pueden ir en la misma migración de Prisma, pero el backfill de datos requiere SQL explícito porque Prisma no puede transformar valores de un enum a otro.

1. `npx prisma migrate dev --name enrollment_schedule_balance` — crea `Shift`, `EnrollmentScheduleDay`, `durationDays`, y ajusta `PaymentMethod`. Los nombres de tabla en mayúscula (`EnrollmentScheduleDay`) porque MySQL corre con `lower_case_table_names=0`.
2. En la misma migración, o en un paso posterior documentado, el **backfill de datos**: `UPDATE Payment SET method = 'TRANSFERENCIA' WHERE method = 'TARJETA'` y `UPDATE Payment SET method = 'EFECTIVO' WHERE method = 'CHEQUE'`, antes de que el enum deje de aceptar esos valores.
3. `npx prisma generate`.
4. `npx prisma migrate deploy` en los demás entornos, seguido del backfill equivalente.

**Orden crítico:** el `UPDATE` de backfill debe ejecutarse **antes** de que la definición del enum deje de incluir `TARJETA` y `CHEQUE`, o MySQL rechazará los valores antiguos. Esto se documenta en `tasks.md` como pasos separados y verificables, no como un `migrate dev` único.

Rollback: la definición del enum se puede revertir (los valores vuelven a existir), pero los `UPDATE` de backfill **no son reversibles sin el mapeo original**: si hay pagos `TRANSFERENCIA` que en realidad eran `TARJETA`, revertir el enum los volvería `TRANSFERENCIA`. Antes de correr el backfill conviene un dump.

`durationDays` y `EnrollmentScheduleDay` no necesitan backfill: son columnas nuevas y tablas nuevas, y las inscripciones existentes quedan con agenda vacía y `durationDays` en `NULL`, que es el fallback documentado en D1.

## Open Questions

- Si más adelante se quiere cobrar por área, la relación N:N necesita atributos (`EnrollmentArea` ya es explícita, así que el cambio sería barato). No se decide aquí.
- Si el listado agrupado llegara a tener decenas de miles de inscripciones, el agrupado en memoria se reemplazaría por `GROUP BY` en SQL con funciones de ventana. A la escala del centro (173 inscripciones) es innecesario.
- Si el saldo debe distinguir meses vencidos de meses por vencer, hace falta una fecha de corte por mes en `Enrollment`; no está en alcance.
- Si el pago inicial debería ser obligatorio en el backend cuando el monto es mayor a cero, es una política de negocio que no está decidida.