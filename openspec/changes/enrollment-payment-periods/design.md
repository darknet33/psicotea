## Context

El módulo económico actual asume un único modelo: **cuota mensual fija**. `Enrollment.monthlyFee` es "lo que se cobra por mes" y `Enrollment Balance` (spec `enrollments`) calcula `facturado = monthlyFee × meses`. `Payment` tiene `enrollmentId` opcional que **el frontend nunca envía** (`payment-form.tsx` no lo incluye), así que en la práctica los pagos cuelgan sólo del niño y el saldo por inscripción se vuelve borroso. El formulario además usa el mes de inicio como mes de fin (`periodStart`/`periodEnd` se completan igual) y siempre aplica el pago al mes corriente.

Restricciones que condicionan el diseño:

- **Datos históricos reales.** No se sabe cuántas inscripciones hay ni con qué montos; el change anterior dejó 173 inscripciones de ejemplo. La migración no puede inventar tipos ni montos.
- **`Decimal` serializado a `number`** ya está resuelto por `DecimalToNumberInterceptor` (change anterior). Se reutiliza.
- **Sin motor de migraciones destructivo.** Prisma `migrate dev` genera `DROP`/`ADD` para un rename de campo; hay que usar SQL explícito para preservar `monthlyFee`.
- **Dos flujos de escritura** tocan saldos: `POST /enrollments` (pago inicial) y `POST /payments`. Ambos deben pasar por la misma lógica de aplicación de pagos, dentro de transacción.

El objetivo operativo cambia de "cuota mensual" a "**monto por período**": una inscripción trimestral de Bs 2.400 es una obligación de Bs 2.400, y los pagos la saldan total o parcialmente, sin subdividirla en meses.

## Goals / Non-Goals

**Goals:**

- Monto personalizado por inscripción, único para su período, editable y > 0.
- Tipo de inscripción (`MENSUAL | TRIMESTRAL | SEMESTRAL | ANUAL`) con duración y fecha de fin derivadas en el backend.
- Inscripción vigente por rango de fechas (`startDate <= hoy <= endDate`), con prevención de solapamiento por niño.
- Reinscripción con prefill editable desde la inscripción anterior, sin cerrar ni borrar nada.
- Pago aplicado a una o varias inscripciones (`PaymentAllocation`), conservando el movimiento original y su trazabilidad.
- Separación explícita entre **fecha de pago** y **período cubierto**.
- Deudas anteriores visibles aparte de la inscripción vigente, calculadas con datos reales.
- Cálculo monetario exacto en centavos; sin errores de punto flotante.
- Migración que preserva montos históricos y marca lo ambiguo para revisión.
- Interfaz sin "facturación": total de inscripción / total pagado / saldo pendiente.

**Non-Goals:**

- Pasarela de pagos o comprobantes digitales.
- Recordatorios automáticos o generación de cargos recurrentes.
- Conversión automática de un monto de período a cuotas mensuales (el total pertenece a la inscripción completa).
- Borrado de deudas o pagos al reinscribir.
- Cuentas contables, impuestos o notas de crédito/débito.
- Rediseño del catálogo de áreas o de la agenda semanal (se conservan).

## Decisions

### D1: `monthlyFee` se renombra a `amount` (migración con SQL explícito)

El nombre `monthlyFee` deja de representar la realidad. Se renombra la columna (`ALTER TABLE Enrollment CHANGE monthlyFee amount DECIMAL(10,2) NOT NULL`) y el valor histórico se conserva tal cual. Prisma se declara con `amount Decimal @db.Decimal(10,2)`.

- Alternativa considerada: **agregar** `amount` y dejar `monthlyFee` deprecado. Rechazada: dos campos con el mismo dato invitan a divergir y a que un servicio siga leyendo el viejo.
- Alternativa considerada: dejar `monthlyFee` y reinterpretarlo. Rechazada: el nombre miente y el requisito pide explícitamente un nombre coherente.
- Consecuencia: hay que actualizar **todos** los usos de `monthlyFee` en backend (schema, service, DTOs, tests, seed), frontend (tipos, formularios, páginas) y specs. La lista es corta y acotada porque el módulo es pequeño.

### D2: Tipo de inscripción como enum fijo, duración derivada en el backend

`EnrollmentType` es un enum (`MENSUAL | TRIMESTRAL | SEMESTRAL | ANUAL`) con el mapa `MENSUAL→30`, `TRIMESTRAL→90`, `SEMESTRAL→180`, `ANUAL→360`. `POST/PATCH` reciben `type`; el service deriva `durationDays` y `endDate`. El cliente **no** envía días ni fecha de fin.

`durationDays` se sigue **persistiendo** (derivado) para no romper consumidores que ya lo leen (detalle, credencial, reportes). `endDate = startDate + durationDays` (igual que hoy), y la vigencia se evalúa con `startDate <= hoy <= endDate`.

- Alternativa considerada: tabla `EnrollmentType` administrable. Rechazada: los cuatro tipos son fijos y no hay pedido de administrarlos; un enum es más simple y evita joins.
- Alternativa considerada: dejar de persistir `durationDays` y derivarlo siempre. Rechazada: rompe consumidores existentes y obliga a recomputar en cada lectura.
- Nota de calendario: `durationDays` cuenta días corridos desde `startDate`; se documenta para que "Mensual" cubra un mes calendario completo cuando el mes tiene 30/31 días.

### D3: `PaymentAllocation` como fuente de verdad de la aplicación del pago

Nueva tabla:

```prisma
model PaymentAllocation {
  id           Int        @id @default(autoincrement())
  paymentId    Int
  payment      Payment    @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  enrollmentId Int
  enrollment   Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  amount       Decimal    @db.Decimal(10,2)
  createdAt    DateTime   @default(now())

  @@unique([paymentId, enrollmentId])
  @@index([enrollmentId])
}
```

Un `Payment` tiene una o varias `PaymentAllocation`. El saldo de una inscripción es `amount − Σ allocations`. `Payment.enrollmentId` se **conserva** como columna de compatibilidad (inscripción principal), pero el cálculo **sólo** mira `PaymentAllocation`. Si un pago no tiene allocation (dato histórico sin `enrollmentId`), no afecta saldos y se reporta para revisión.

- Alternativa considerada: un array JSON `allocations` en `Payment`. Rechazada: no se puede agregar por inscripción en SQL ni mantener integridad referencial.
- Alternativa considerada: mover el monto de `Payment` a la inscripción con `enrollmentId` obligatorio. Rechazada: no permite un pago que cubra varias obligaciones, que es un requisito explícito.
- Alternativa considerada: quitar `Payment.enrollmentId`. Rechazada en esta iteración: la credencial y algunos consumidores lo leen; se deja como conveniencia y se documenta que es derivado.

### D4: Un pago puede cubrir varias obligaciones; por defecto, la deuda más antigua

`POST /payments` acepta dos formas:

1. **Explícita**: `allocations: [{ enrollmentId, amount }]`. Cada `enrollmentId` debe pertenecer al niño; la suma de los `amount` debe ser igual al `amount` del pago (en centavos).
2. **Sin destino**: `enrollmentId` suelto (compatibilidad) o nada. El service reparte **de la obligación más antigua a la más reciente**: ordena las inscripciones con `saldo > 0` por `startDate asc` y aplica el pago en orden hasta agotarlo. Si el pago supera la deuda total, el excedente se aplica a la inscripción más reciente como **saldo a favor** (no se pierde ni se descarta el dinero).

El pago inicial (`initialPayment`) es el caso particular de una sola allocation a la inscripción recién creada; se valida que no supere el saldo (que en ese momento es el `amount` completo).

- Alternativa considerada: exigir siempre `allocations`. Rechazada: complica el cobro rápido de una sola deuda, que es el caso frecuente.
- Alternativa considerada: rechazar pagos mayores a la deuda. Rechazada: el padre puede pagar de más; perder ese excedente sería incorrecto. Se modela como saldo a favor.
- El reparto se hace en **enteros de centavos** y el residuo de redondeo se asigna a la obligación más antigua, de modo que `Σ allocations` sea exactamente igual al monto del pago.

### D5: Dinero en centavos dentro del service

Todas las operaciones de reparto y saldo usan `Math.round(x * 100)` y aritmética entera; se convierte a `Decimal` sólo al persistir. Esto evita que `0.1 + 0.2` produzca `0.30000000000000004` y que dos pagos parciales dejen un saldo de `-0.0000001`.

- Alternativa considerada: `Decimal` de Prisma para toda la aritmética. Rechazada: hace el código verboso y propenso a comparar objetos en lugar de valores.
- Alternativa considerada: `number` sin redondeo. Rechazada: es exactamente la fuente de error que el requisito pide evitar.

### D6: Vigencia por rango de fechas y prevención de solapamiento

Una inscripción está **vigente** si `status = ACTIVO` **y** `startDate <= hoy <= endDate`. El listado y el detalle exponen `vigente: boolean`.

No se puede crear ni editar una inscripción cuyas fechas se solapen con otra del mismo niño, **sin importar el estado**: dos rangos se solapan si `a.startDate <= b.endDate && b.startDate <= a.endDate`. Se rechaza con 400.

La regla anterior de "máximo una `ACTIVO` por niño" se **relaja**: lo que importa es que no se solapen los períodos. Una inscripción futura puede crearse mientras la actual sigue vigente, siempre que empiece después de su `endDate`.

- Alternativa considerada: mantener "una sola ACTIVO" y calcular `endDate` inexistente como infinito. Rechazada: impide preparar la reinscripción futura y es la causa de que hoy haya que retirar primero.
- Alternativa considerada: validar solapamiento sólo contra `ACTIVO`. Rechazada: dos `INACTIVO` solapadas siguen siendo datos incoherentes.
- La validación vive en el service dentro de la transacción; MySQL no tiene índices únicos parciales para expresarla. Se acepta la brecha teórica de concurrencia y se documenta.

### D7: Saldo sin multiplicar por meses; "facturado" desaparece

El total de una inscripción es su `amount`. `pagado = Σ PaymentAllocation.amount`; `saldo = amount − pagado`. Se elimina por completo la multiplicación `monthlyFee × meses` y el concepto `facturado` de la API. El frontend etiqueta "Total de la inscripción", "Total pagado" y "Saldo pendiente".

`countBilledMonths` y la lógica mensual de `getPendingPayments` se reinterpretan: ya no generan una obligación por mes. El período sigue siendo útil para **ubicar** un pago en el historial (mes de referencia), nunca para crear cargos.

- Alternativa considerada: mantener `facturado` como alias de `amount` para no tocar el frontend. Rechazada: perpetúa el nombre prohibido por el requisito.
- Alternativa considerada: dividir el monto entre los meses del período para "cuotas". Rechazada explícitamente por el requisito.

### D8: Reinscripción como alta con prefill, sin tocar el pasado

`GET /enrollments/child/:childId/prefill` devuelve la inscripción más reciente con `type`, `amount`, `areaIds`, `scheduleDays` y `startDate = endDate + 1 día`. Son sugerencias editables. La inscripción anterior **no** se cierra, **no** se borra y sus deudas y pagos permanecen intactos. La nueva inscripción genera su propia obligación.

- Alternativa considerada: cerrar automáticamente la anterior al reinscribir. Rechazada por requisito y porque una inscripción futura puede convivir con una vigente.
- Alternativa considerada: copiar también el `endDate` anterior como inicio. Rechazada: produciría solapamiento; se propone el día siguiente.

### D9: Separación fecha de pago / período cubierto

`paymentDate` es cuándo entró el dinero; `periodStart`/`periodEnd` son a qué obligación/período corresponde. El backend los guarda por separado y **no** los sincroniza. El formulario deja de completar `periodEnd` con el mes de `periodStart` y deja de forzar el período al mes actual: ambos son campos independientes, con la fecha de pago por defecto en hoy.

### D10: API y tipos

- `Enrollment` en respuestas: `id`, `childId`, `type`, `startDate`, `endDate`, `durationDays`, `status`, `amount`, `notas`, agenda, áreas, `pagado`, `saldo`, `vigente`.
- `Payment` incluye `allocations: [{ enrollmentId, amount }]` y, por compatibilidad, `enrollmentId` (primera allocation).
- Se conserva `DecimalToNumberInterceptor`.
- Se **elimina** `facturado` de los tipos y consumidores; el dashboard y el listado se adaptan a `total = amount`.

### D11: `ChildrenService.findOne` deja de ser la fuente del estado económico

Hoy el perfil del niño consume `payments` sueltos de `GET /children/:id` y `enrollments` de `GET /enrollments/child/:childId`. Para mostrar el resumen por inscripción y las deudas anteriores, el perfil se alimenta de un endpoint dedicado `GET /enrollments/child/:childId/summary` que devuelve inscripciones con sus totales, la vigente marcada y las deudas anteriores separadas. `ChildrenService` sigue devolviendo pagos por compatibilidad de la credencial, pero la UI económica usa el summary.

- Alternativa considerada: calcular el resumen en el frontend a partir de dos llamadas. Rechazada: duplica la lógica de saldo en el cliente y puede divergir del backend.

### D12: Migración de datos conservadora

1. `amount` conserva el valor de `monthlyFee`.
2. `type` se agrega **nullable** y se hace backfill por duración: `30→MENSUAL`, `90→TRIMESTRAL`, `180→SEMESTRAL`, `360→ANUAL`. Las duraciones no reconocidas (p. ej. 365, 60) quedan en `NULL` y se **reportan** en un listado de revisión; no se adivinan.
3. Se crea `PaymentAllocation` y se hace backfill: por cada `Payment` con `enrollmentId` no nulo, una allocation por el monto completo. Los pagos sin `enrollmentId` quedan sin allocation y se **reportan**.
4. No se elimina ninguna columna (`Payment.enrollmentId`, `durationDays`) en esta migración.

## Risks / Trade-offs

- **El rename `monthlyFee → amount` toca muchos archivos** → Mitigación: grep obligatorio de `monthlyFee` al final (backend, frontend, specs, seed) y build de ambos lados. Es un módulo chico.
- **Backfill de `type` a partir de `durationDays` puede no reconocer el valor histórico** → Mitigación: queda `NULL` y un reporte de revisión; el service degrada con un fallback y no inventa datos. El campo se puede completar a mano después.
- **Pagos históricos sin `enrollmentId` quedan sin obligación** → Mitigación: no afectan saldos y se listan para revisión; no se les asigna un destino adivinado.
- **Doble fuente de verdad entre `Payment.enrollmentId` y `PaymentAllocation`** → Mitigación: el cálculo usa sólo allocations; `enrollmentId` se sincroniza como "principal" al escribir y se documenta como derivado. Un test compara ambos.
- **Saldo a favor (pago mayor a la deuda)** → Mitigación: se modela como allocation a la inscripción más reciente; el saldo puede ser negativo y la UI lo muestra explícitamente.
- **Reparto de centavos** → Mitigación: aritmética entera y residuo a la obligación más antigua; test que verifica `Σ allocations == payment.amount`.
- **Transaccionalidad** → Inscripción + pago inicial y pago + allocations se ejecutan en `$transaction`; un fallo no deja saldos parciales.
- **Brecha de concurrencia en el solapamiento** → Aceptada (D6); validación dentro de la transacción y test secuencial que cubre el caso real.

## Migration Plan

Orden crítico, por pasos verificables (no un único `migrate dev`):

1. **Dump / respaldo** de la base antes de tocar nada.
2. Conteo previo: `SELECT COUNT(*), MIN(monthlyFee), MAX(monthlyFee) FROM Enrollment;` y `SELECT DISTINCT durationDays FROM Enrollment;`.
3. Migración SQL: `ALTER TABLE Enrollment CHANGE monthlyFee amount DECIMAL(10,2) NOT NULL;` (o `RENAME COLUMN` según la versión de MySQL). Prisma se edita a `amount` en el mismo paso.
4. Agregar `enum EnrollmentType` y columna `Enrollment.type` **nullable**; backfill por `durationDays` según D12; listar los `type IS NULL` como revisión.
5. Crear `PaymentAllocation`; backfill desde `Payment.enrollmentId`; listar los pagos sin `enrollmentId` como revisión.
6. `npx prisma generate`, `npx prisma migrate status`, build y tests.
7. `npx prisma migrate deploy` en los demás entornos con los mismos backfills.

Rollback: el rename se revierte con `CHANGE amount monthlyFee`. Las tablas/columnas nuevas se pueden eliminar. El backfill de `type` no es destructivo (sólo escribe `NULL` o un valor inferible). Antes de correr los `UPDATE` conviene el dump del paso 1.

## Open Questions

- Si `type` debe volverse `NOT NULL` en una migración posterior una vez revisados los `NULL`, o si se acepta un fallback permanente. Se inclina por una segunda migración de endurecimiento tras la revisión, fuera de este change.
- Si un pago debe permitir aplicarse a una inscripción **futura** (no vencida) además de las vigentes/anteriores. Por ahora el reparto automático sólo considera saldos > 0 en orden de antigüedad.
- Si el saldo a favor debe ser canjeable en la reinscripción; no está en alcance.
- Si se quiere un recibo imprimible por pago; queda para una capability aparte.

## Anexo: Auditoría de datos previa a la migración

Ejecutada el 2026-10-08 contra `psicotea_db` (MySQL 8.4) con `backend/scripts/audit-enrollment-migration.js`. El resultado completo quedó en `migration-audit.json` (mismo directorio del change).

| Métrica | Valor |
| --- | --- |
| Inscripciones (`Enrollment`) | 0 |
| Pagos (`Payment`) | 0 |
| Duraciones distintas | (ninguna) |
| Inscripciones con `monthlyFee <= 0` | 0 |
| Duraciones no reconocidas (fuera de {30, 90, 180, 360}) | 0 |
| Pagos con `enrollmentId` | 0 |
| Pagos sin `enrollmentId` | 0 |
| `SUM(monthlyFee)` previo | 0 |

La base de desarrollo está **vacía**: no hay registros ambiguos que revisar y el backfill no tiene datos que convertir. La migración se genera de forma conservadora igualmente, para que sea aplicable a entornos con datos (producción de ejemplo: 173 inscripciones según el change anterior).

**Entorno confirmado:** MySQL Server 8.4 → soporta `ALTER TABLE ... RENAME COLUMN`. En este change se usa `CHANGE COLUMN` por compatibilidad con versiones 5.x/8.x previas a 8.0 y con MariaDB.

**Respaldo:** `mysqldump` (MySQL 8.4) a `%TEMP%\opencode\psicotea_db_backup_20261008_222900.sql` (fuera del repositorio), previo a cualquier cambio de esquema.
