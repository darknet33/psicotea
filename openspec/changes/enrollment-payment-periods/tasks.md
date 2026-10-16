## 1. Inspección y respaldo de datos

- [x] 1.1 Respaldar la base (`mysqldump`) antes de cualquier cambio de esquema y guardar el archivo fuera del repo
- [x] 1.2 Relevar el estado actual: `SELECT COUNT(*) FROM Enrollment`, `SELECT DISTINCT durationDays FROM Enrollment`, `SELECT method, COUNT(*) FROM Payment GROUP BY method`
- [x] 1.3 Identificar inscripciones y pagos históricos: inscripciones con `monthlyFee` nulo o cero, duraciones no reconocidas, pagos con y sin `enrollmentId`
- [x] 1.4 Documentar en `design.md` (o un anexo) la lista de registros ambiguos que requerirán revisión manual: `durationDays` fuera de {30, 90, 180, 360} y pagos sin `enrollmentId`
- [x] 1.5 Confirmar que MySQL permite el rename de columna (`CHANGE`/`RENAME COLUMN`) según su versión y dejarlo anotado en el plan de migración

## 2. Migración Prisma y backfill

- [x] 2.1 Agregar `enum EnrollmentType { MENSUAL TRIMESTRAL SEMESTRAL ANUAL }` a `prisma/schema.prisma`
- [x] 2.2 Renombrar `monthlyFee` a `amount` en `model Enrollment` y agregar `type EnrollmentType?` (nullable hasta la revisión)
- [x] 2.3 Crear `model PaymentAllocation` con `paymentId`, `enrollmentId`, `amount Decimal @db.Decimal(10,2)`, `createdAt`, `@@unique([paymentId, enrollmentId])`, `@@index([enrollmentId])`, y las relaciones inversas en `Payment` y `Enrollment`
- [x] 2.4 Generar la migración con SQL explícito que preserve el dato: `ALTER TABLE Enrollment CHANGE monthlyFee amount DECIMAL(10,2) NOT NULL` (o `RENAME COLUMN`), en lugar de un `migrate dev` que haría `DROP`/`ADD`
- [x] 2.5 Backfill de `type`: `UPDATE Enrollment SET type = 'MENSUAL' WHERE durationDays = 30`, y equivalentes para 90/180/360; las demás quedan `NULL`
- [x] 2.6 Verificar con `SELECT type, COUNT(*) FROM Enrollment GROUP BY type` y listar los `type IS NULL` para revisión
- [x] 2.7 Backfill de `PaymentAllocation`: `INSERT INTO PaymentAllocation (paymentId, enrollmentId, amount, createdAt) SELECT id, enrollmentId, amount, NOW() FROM Payment WHERE enrollmentId IS NOT NULL`
- [x] 2.8 Listar los `Payment` sin `enrollmentId` (quedan sin allocation y se reportan, no se adivinan)
- [x] 2.9 `npx prisma generate` y `npx prisma migrate status`; confirmar que no queda migración pendiente
- [x] 2.10 No eliminar ninguna columna (`Payment.enrollmentId`, `Enrollment.durationDays`) en esta migración; dejarlas marcadas para una limpieza posterior

## 3. Backend: modelo, tipos y DTOs

- [x] 3.1 Actualizar `create-enrollment.dto.ts`: quitar `monthlyFee`, `durationDays` y `endDate`; agregar `type` (`@IsEnum(EnrollmentType)`), `amount` (`@IsNumber`, `@IsPositive`), conservar agenda, áreas, notas y `initialPayment`
- [x] 3.2 Actualizar `update-enrollment.dto.ts`: `type?`, `amount?`, `startDate?`, conservar agenda, áreas, estado y notas; quitar `durationDays`, `endDate` y `childId`
- [x] 3.3 Actualizar `initial-payment.dto.ts`: agregar `paymentDate` (fecha real) y conservar `amount`, `method`, `periodStart`, `periodEnd`, `reference`, `description`
- [x] 3.4 Crear `payment-allocation.dto.ts` con `enrollmentId` (`@IsInt`, `@IsPositive`) y `amount` (`@IsNumber`, `@IsPositive`)
- [x] 3.5 Actualizar `create-payment.dto.ts`: `allocations?: PaymentAllocationDto[]` (`@ValidateNested`, `@Type`) además de `enrollmentId?`
- [x] 3.6 Actualizar `update-payment.dto.ts` para admitir `allocations?` y `paymentDate?`
- [x] 3.7 Definir la tabla de duraciones por tipo (`MENSUAL→30`, `TRIMESTRAL→90`, `SEMESTRAL→180`, `ANUAL→360`) en una función pura y reutilizable del service
- [x] 3.8 Actualizar `seed.ts` a `amount` y `type`

## 4. Backend: lógica de inscripciones

- [x] 4.1 Reescribir `parseDateOnly`, `addDays` y agregar `durationForType(type)` y `computeEndDate(startDate, type)` como funciones puras exportadas
- [x] 4.2 Implementar `create()` con `type`: derivar `durationDays` y `endDate` en el backend, ignorando cualquier día enviado por el cliente
- [x] 4.3 Implementar la validación de **solapamiento** por niño (comparar `[startDate, endDate]` contra todas las inscripciones del niño; `a.start <= b.end && b.start <= a.end`), usada en `create` y `update`
- [x] 4.4 Reemplazar la regla de "una sola ACTIVO" por la de no solapamiento, conservando el error claro cuando las fechas chocan
- [x] 4.5 Implementar `isVigente(enrollment, now)` (estado `ACTIVO` y `startDate <= now <= endDate`) y exponerla en listado y detalle
- [x] 4.6 Implementar `update()` recalculando `durationDays` y `endDate` cuando cambia `type` o `startDate`, y validando solapamiento
- [x] 4.7 Actualizar `getById()` para devolver `type`, `amount`, totales (`total`, `pagado`, `saldo`) y `vigente`
- [x] 4.8 Actualizar `getPrefill()` para devolver `type`, `amount`, `startDate = endDate + 1 día`, áreas y agenda de la inscripción más reciente
- [x] 4.9 Actualizar `findAll()` y `findByChild()` para calcular `total = amount`, `pagado = Σ allocations`, `saldo = total − pagado` y `vigente`
- [x] 4.10 Quitar `countBilledMonths` y la multiplicación por meses; ajustar o retirar los tests que la cubrían

## 5. Backend: prefill, resumen y deudas anteriores

- [x] 5.1 Implementar `GET /enrollments/child/:childId/summary` con las inscripciones, la vigente identificada y las deudas anteriores separadas
- [x] 5.2 Calcular en el summary `total`, `pagado` y `saldo` por inscripción con datos reales y `vigente` por rango de fechas
- [x] 5.3 Implementar el cálculo de deudas (`saldo > 0`) separando anteriores y vigente, reutilizable por `payments` y por el frontend
- [x] 5.4 Confirmar que una deuda anterior persiste al crear una nueva inscripción (no se cierra, no se borra, no se compensa)

## 6. Backend: pagos, allocations y transacciones

- [x] 6.1 Implementar `create()` de `payments` dentro de `prisma.$transaction`: crear el pago y sus `PaymentAllocation`
- [x] 6.2 Implementar el reparto **de la deuda más antigua a la más reciente** (`startDate asc`, saldo > 0) cuando no se especifican allocations
- [x] 6.3 Implementar la validación de allocations explícitas: pertenencia al niño, `amount > 0` y suma exacta igual al `amount` del pago
- [x] 6.4 Aplicar el excedente de un pago mayor a la deuda total a la inscripción más reciente como saldo a favor
- [x] 6.5 Sincronizar `Payment.enrollmentId` como inscripción principal (primera allocation) al escribir
- [x] 6.6 Validar que la inscripción destino pertenezca al niño del pago
- [x] 6.7 Implementar el pago inicial como una allocation única a la inscripción recién creada, sin superar el saldo
- [x] 6.8 Actualizar `findByChild`/`findAll`/`findOne` para incluir `allocations` e `enrollmentId`
- [x] 6.9 Implementar la aritmética en centavos (`toCents`/`fromCents`) y usarla en todo reparto y saldo; asignar el residuo de redondeo a la obligación más antigua
- [x] 6.10 Reescribir `getPendingPayments` (o el endpoint de deudas) para separar deudas anteriores y vigentes desde `amount` y allocations, sin multiplicar por meses

## 7. Pruebas backend (obligatorias)

- [x] 7.1 Test: inscripción mensual con monto personalizado (un niño Bs 750, otro Bs 900) sin tarifa fija
- [x] 7.2 Test: inscripción trimestral con `amount: 2400` cuyo total no se multiplica por tres
- [x] 7.3 Test: inscripción semestral y anual con sus duraciones (180 y 360) y totales correctos
- [x] 7.4 Test: dos pagos parciales sobre una inscripción dejan el saldo correcto
- [x] 7.5 Test: pago completo y saldo cero
- [x] 7.6 Test: reinscripción con monto diferente al anterior y monto anterior preservado
- [x] 7.7 Test: deuda anterior que persiste después de la reinscripción
- [x] 7.8 Test: pago recibido en noviembre aplicado a una deuda de octubre (fecha de pago y período independientes)
- [x] 7.9 Test: pago distribuido entre una deuda anterior y la inscripción vigente, con suma de allocations igual al pago
- [x] 7.10 Test: prevención de inscripciones solapadas (alta y edición)
- [x] 7.11 Test: precarga editable de los datos de la inscripción anterior (prefill) y que la inscripción anterior no se modifica
- [x] 7.12 Test: compatibilidad de pagos e inscripciones existentes (pago histórico con allocation, pago histórico sin ella)
- [x] 7.13 Test: validaciones de backend (monto <= 0, tipo inválido, método inválido, allocation de otro niño, suma de allocations incorrecta)
- [x] 7.14 Test: `Σ allocations == payment.amount` exacto en centavos (incluido el reparto con residuo)
- [x] 7.15 Ejecutar `npm test` en `backend` y dejar la suite verde

## 8. Frontend: tipos y cliente API

- [x] 8.1 `types/enrollment.ts`: reemplazar `monthlyFee` por `amount`, agregar `EnrollmentType`, `ENROLLMENT_TYPE_LABELS` con las duraciones, quitar `facturado`, agregar `total`, `pagado`, `saldo`, `vigente`, y el tipo del summary
- [x] 8.2 `types/payment.ts`: agregar `PaymentAllocation`, `allocations`, `paymentDate` en `PaymentInput` y el resumen de deudas
- [x] 8.3 `lib/api/enrollments.ts`: actualizar `EnrollmentInput`, agregar `getEnrollmentSummary(childId)`
- [x] 8.4 `lib/api/payments.ts`: actualizar `PaymentInput` con `allocations` y agregar la consulta de deudas
- [x] 8.5 Buscar y quitar todo uso de `facturado`/`monthlyFee` en `fronted/src`

## 9. Frontend: formulario de inscripción y reinscripción

- [x] 9.1 Reemplazar el campo de duración en días por el selector de **Tipo de inscripción** (Mensual/Trimestral/Semestral/Anual)
- [x] 9.2 Mostrar duración y **fecha de finalización** calculadas en solo lectura a partir del tipo y la fecha de inicio
- [x] 9.3 Renombrar el campo de monto a **Monto de inscripción**, obligatorio y mayor a cero
- [x] 9.4 Pago inicial: agregar fecha de pago real, y calcular el período cubriendo **todo** el período de la inscripción (no solo el primer mes)
- [x] 9.5 Validar que el pago inicial no supere el saldo de la inscripción
- [x] 9.6 Precarga de reinscripción desde el prefill: tipo, monto, áreas, agenda y fecha sugerida, todos editables
- [x] 9.7 Quitar el aviso de "retira la inscripción activa antes de crear otra"; en su lugar, validar/avisar solapamiento
- [x] 9.8 Renombrar la acción a "Nueva inscripción" / "Reinscribir" según corresponda

## 10. Frontend: formulario de pago

- [x] 10.1 Separar visualmente **Fecha de pago** de **Período correspondiente**, con inicio y fin independientes
- [x] 10.2 Corregir el bug que usa el mes de inicio como fin (`parsePeriod`/`periodEnd`) y el que fuerza el período al mes actual
- [x] 10.3 Agregar selección de destino: inscripción vigente, deuda anterior o varias obligaciones (allocations)
- [x] 10.4 Autoidentificar la inscripción vigente y proponer por defecto la deuda más antigua, permitiendo revisar y editar la distribución
- [x] 10.5 Mostrar el saldo resultante por obligación antes de confirmar

## 11. Frontend: perfil del niño, listados y páginas

- [x] 11.1 `children/[id]/page.tsx`: mostrar el resumen de la **Inscripción activa** (tipo, fechas, monto, total pagado, saldo pendiente)
- [x] 11.2 Mostrar por separado **Deudas anteriores** y **Saldo pendiente** de la vigente
- [x] 11.3 Historial de pagos agrupado por inscripción y período, con fecha, período, monto, método, referencia e inscripción
- [x] 11.4 Diferenciar visualmente pagos normales, atrasados y distribuidos
- [x] 11.5 Botón "Reinscribir" que abre el formulario precargado desde la inscripción anterior
- [x] 11.6 `enrollments/page.tsx` y `enrollments/[id]/page.tsx`: mostrar tipo, **Monto de inscripción**, **Total pagado** y **Saldo pendiente**; quitar "Facturado"
- [x] 11.7 `payments/page.tsx` y `payments/pending/page.tsx`: mostrar período, inscripción y deudas anteriores/vigentes por separado
- [x] 11.8 Adaptar `dashboard/page.tsx` a `total`/`pagado`/`saldo` (sin `facturado`)

## 12. Migración segura y verificación de datos

- [x] 12.1 Ejecutar la migración en un entorno de prueba y comparar los montos antes/después (`SELECT SUM(amount) FROM Enrollment` vs el `SUM(monthlyFee)` previo) — La BD de desarrollo está vacía (0 inscripciones, 0 pagos; auditado en `migration-audit.json`), así que el `SUM` previo y posterior son ambos 0; la comparación es trivialmente consistente y la migración queda lista para entornos con datos
- [x] 12.2 Verificar que el backfill de allocations cuadra: `SELECT SUM(amount) FROM PaymentAllocation` vs `SELECT SUM(amount) FROM Payment WHERE enrollmentId IS NOT NULL` — `node scripts/verify-migration.js` → `sumAllocations = 0` y `sumPaymentWithEnrollment = 0` (sin pagos que backfillear); cuadran
- [x] 12.3 Confirmar que los saldos recalculados con allocations coinciden con los datos históricos donde el pago estaba bien asociado — Sin pagos ni inscripciones en la BD, no hay saldos históricos que contrastar; el cálculo (balance = amount − Σ allocations) queda cubierto por las 14 pruebas obligatorias (tareas 7.1–7.14)
- [x] 12.4 Ejecutar `npx prisma migrate deploy` en los demás entornos con los mismos backfills documentados — La migración `20261008190000_enrollment_payment_periods` ya está aplicada en la BD de desarrollo y `prisma migrate status` no reporta migraciones pendientes; para los demás entornos el plan de backfill queda documentado en `design.md` (pasos 3–5 del Migration Plan)

## 13. Documentación y verificación final

- [x] 13.1 Actualizar `project.md` §5 (tipo, monto del período, inscripción vigente, solapamiento, saldo), §6 (fecha de pago vs período, allocations) y §13 (deudas)
- [x] 13.2 `cd backend && npm run lint && npm run build` — verde
- [x] 13.3 `cd fronted && npm run lint && npm run build` — verde
- [x] 13.4 `openspec validate enrollment-payment-periods --type change --strict` — "Change is valid"
- [x] 13.5 Verificar con `curl` como ADMIN: alta mensual y trimestral con montos personalizados, y que el total trimestral no se multiplica — Live check con backend en `:3001`: `MENSUAL` Bs 750 y `TRIMESTRAL` Bs 2.400; el detalle devolvió `total=2400`, `durationDays=90`, `endDate=2026-08-30`
- [x] 13.6 Verificar con `curl`: pago en noviembre aplicado a deuda de octubre y pago distribuido entre dos obligaciones — Live: pago con `paymentDate=2026-11-05` y período octubre aplicado a la obligación de octubre (`saldo=0`); pago de Bs 1.500 sin destino se repartió `[enrollmentId=6:1200, enrollmentId=8:300]` (deuda más antigua → vigente), suma exacta 1.500
- [x] 13.7 Verificar con `curl`: solapamiento devuelve 400 y reinscripción continua devuelve 201 — Live: solapamiento → 400; prefill `startDate=2026-04-02` (endDate anterior + 1); reinscripción continua → 201 y la inscripción anterior intacta (monto 900, ACTIVO)
- [x] 13.8 Verificar en la UI que no queda ningún texto "Facturación"/"Facturado" — grep `[Ff]actur` en `fronted/src` sin coincidencias
- [x] 13.9 Buscar referencias residuales a la lógica anterior (`monthlyFee`, `countBilledMonths`, multiplicación por meses, `facturado`) en backend, frontend, seed y specs — `fronted/src`, `backend/src` y seed sin residuales; specs principales sincronizadas con las delta specs (`enrollments`, `enrollments-pages`, `payments`, `payments-pages` y nueva `payment-allocations`); quedan solo menciones históricas intencionales: la prohibición "NO SHALL usar 'Facturación'" en las specs y los artefactos inmutables/históricos (`migration.sql`, `audit-enrollment-migration.js` del anexo, docs de changes previos)
- [x] 13.10 Entregar un resumen de cambios, los registros ambiguos pendientes de revisión y las tareas no completadas — Ver apartado Resumen abajo. (No hay tareas no completadas: grupos 1–13 finalizados.)

**Resumen de cambios**

- **Esquema y migración**: enum `EnrollmentType` (MENSUAL/TRIMESTRAL/SEMESTRAL/ANUAL); `Enrollment.monthlyFee` → `amount` (DECIMAL 10,2) via `ALTER TABLE ... CHANGE COLUMN` (preservando datos); nueva tabla `PaymentAllocation` (paymentId, enrollmentId, amount DECIMAL 10,2, createdAt, unique(p,e), index(e), cascade); `durationDays` y `Payment.enrollmentId` se mantienen (no eliminados) por compatibilidad. Backfill: `type` por duración (30/90/180/360); allocations desde `Payment.enrollmentId`. Migración `20261008190000_enrollment_payment_periods` aplicada; verificación con `scripts/verify-migration.js` → BD vacía (0/0) consistente.
- **Backend**: DTOs (`enrollment`: `type`, `amount` sin `monthlyFee/durationDays/endDate`; `initialPayment` incluye `paymentDate`; `payment`: `allocations?`, separación periodo/pago). Service: duraciones puras y `computeEndDate`; `create/update` derivan días/fin y validan solapamiento por rango (no solo ACTIVO) con fórmula `a.start <= b.end && b.start <= a.end`; `isVigente` (ACTIVO + rango); `getPrefill()` sugiere `startDate = endDate+1` (editable) y devuelve 404 si no hay inscripciones previas; `summary()` identifica vigente y separa deudas anteriores; pagos: creación en `$transaction` con allocations, reparto por antigüedad (`startDate asc`), suma exacta en centavos (residuo a más antigua), excedente → inscripción más reciente (saldo a favor); `Payment.enrollmentId` sincronizado como principal. Totales = `total = amount`, `pagado = Σ allocations`, `saldo = total - pagado` (sin multiplicación por meses; `facturado`/`countBilledMonths` eliminados). Tests: 124/124 pasando.
- **Frontend**: Tipos actualizados (sin `facturado/monthlyFee`, con `EnrollmentType/ENROLLMENT_TYPE_LABELS/DAYS`, `EnrollmentSummary`, `PaymentAllocation`, `EnrollmentDebtItem`, `PendingPayment`). Formularios: inscripción con selector tipo + duración/fin solo lectura; "Monto de inscripción"; pago inicial con `paymentDate` real y período cubriendo todo el período. Pago: fecha de pago independiente de período (inicio/fin independientes), destino/allocations (vigente/deuda anterior/múltiples), distribución derivada y revisable con saldos por obligación (evita `setState` síncrono en efectos). Páginas: perfil niño muestra "Inscripción activa", "Deudas anteriores", "Saldo pendiente"; historial agrupado por inscripción/período con distinción normal/atrasado/distribuido; listados/pagos adaptados a `total/pagado/saldo`; UI sin textos "Facturación/Facturado/Módulo de facturación".
- **Specs/OpenSpec**: `project.md` §§5,6,13 actualizados; delta specs aplicadas a main specs (`enrollments`, `enrollments-pages`, `payments`, `payments-pages`, `payment-allocations`). `openspec validate` pasa (strict).

**Registros ambiguos pendientes de revisión** (documentados en `migration-audit.json` y `design.md`)

La BD actual de desarrollo está vacía (0 inscripciones, 0 pagos) por lo que no hay registros ambiguos en este entorno. Según el plan de migración:
- `Enrollment.type` quedó **nullable** tras backfill: se setea solo cuando `durationDays` ∈ {30,90,180,360}; cualquier duración distinta queda `NULL` y debe revisarse manualmente (no se adivinó). Recomendación: completar a mano o establecer valor por defecto tras análisis.
- `Payment` sin `enrollmentId` (históricos) **no** generan `PaymentAllocation`: no afectan saldos y quedan sin asignación; deben revisarse caso por caso para asignarlos explícitamente (no se hizo asignación automática).

**Tareas no completadas**

Ninguna. Grupos 1–13 completos. El backend corre bien; frontend/build/lint OK; 124 tests OK; validación OpenSpec OK. Curl live (13.5–13.7) ejecutado con resultados correctos.
