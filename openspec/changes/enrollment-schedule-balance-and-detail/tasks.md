## 1. Migraciones Prisma

- [x] 1.1 Agregar `enum Shift { TODO_DIA MANANA TARDE }` y `model EnrollmentScheduleDay` a `prisma/schema.prisma`, con `@@unique([enrollmentId, dayOfWeek])`, FK a `Enrollment` con `onDelete: Cascade` y `@@index([dayOfWeek])`
- [x] 1.2 Agregar `durationDays Int?` y `scheduleDays EnrollmentScheduleDay[]` a `model Enrollment`
- [x] 1.3 Cambiar `enum PaymentMethod` a `EFECTIVO QR TRANSFERENCIA` en `schema.prisma`
- [x] 1.4 Generar la migración con `npx prisma migrate diff --from-schema-datasource --to-schema-datamodel --script` y aplicarla con `npx prisma migrate deploy` (el shadow DB de `migrate dev` no replica las migraciones viejas con nombres de tabla en minúscula; los nombres generados van en mayúscula)
- [x] 1.5 Registrar el conteo por método **antes** del backfill: `SELECT method, COUNT(*) FROM Payment GROUP BY method` (en el entorno actual no había pagos, así que el backfill fue no-op)
- [x] 1.6 Incluir el backfill en la migración antes del `MODIFY ... ENUM`: `UPDATE Payment SET method = 'TRANSFERENCIA' WHERE method = 'TARJETA'` y `UPDATE Payment SET method = 'EFECTIVO' WHERE method = 'CHEQUE'`
- [x] 1.7 `npx prisma generate` y `npx prisma migrate status` para confirmar que no queda pendiente
- [x] 1.8 Verificar que las inscripciones existentes quedaron con `durationDays IS NULL` y sin filas en `EnrollmentScheduleDay`, que es el fallback documentado en el design

## 2. Serialización de Decimal

- [x] 2.1 Crear `backend/src/common/interceptors/decimal-to-number.interceptor.ts` con un interceptor que recorra la respuesta y convierta a `number` todo lo que venga como `Prisma.Decimal`
- [x] 2.2 Aplicarlo en los controladores de `enrollments`, `payments` y `children` (este último también devuelve importes)
- [x] 2.3 Confirmar con `curl` que `monthlyFee`, `amount` y los totales salen como números JSON y no como strings

## 3. DTOs

- [x] 3.1 Crear `dto/schedule-day.dto.ts` con `dayOfWeek` (`@IsInt`, `@Min(1)`, `@Max(7)`) y `shift` (`@IsEnum(Shift)`)
- [x] 3.2 Crear `dto/initial-payment.dto.ts` replicando la forma de `CreatePaymentDto`: `amount`, `method`, `periodStart`, `periodEnd`, `reference?`, `description?`
- [x] 3.3 Reescribir `dto/create-enrollment.dto.ts`: agregar `durationDays` (`@IsInt`, `@Min(1)`), `scheduleDays?`, `areaIds?`, `initialPayment?`, y dejar `endDate` opcional
- [x] 3.4 Reescribir `dto/update-enrollment.dto.ts`: quitar `childId`, agregar `durationDays?`, `scheduleDays?`, `areaIds?`
- [x] 3.5 Crear `dto/query-enrollments.dto.ts` con `search?`, `status?` (`@IsEnum`), `childId?`, y `page`/`limit` con `@Type(() => Number)` porque el `ValidationPipe` deja los query params como string
- [x] 3.6 Verificar que `PATCH /enrollments/:id` con `childId` devuelve 400 por `forbidNonWhitelisted`

## 4. Service: cálculo de saldo

- [x] 4.1 Crear la función pura `countBilledMonths(startDate, endDate, now)` que cuenta meses calendario solapados, sin tocar `getPendingPayments` (se decidió no acoplar ambos caminos)
- [x] 4.2 Implementar `computeTotals(enrollment)` que devuelve `{ facturado, pagado, saldo }` con `endDate ?? hoy` como tope
- [x] 4.3 Añadir tests unitarios de `countBilledMonths`: mes completo, rango dentro del mismo mes y sin `endDate`
- [x] 4.4 Añadir tests de los totales a través de `findAll` (suma de cabecera de grupo) y del detalle

## 5. Service: escritura

- [x] 5.1 Implementar `create()` con `prisma.$transaction`: crear inscripción con `endDate` calculado, `create` anidado de días de agenda y `EnrollmentArea`, y `create` del pago inicial con el `enrollmentId` nuevo
- [x] 5.2 Validar `startDate <= endDate` calculado y rechazar con `BadRequestException` si no se cumple
- [x] 5.3 Validar que no exista ya una inscripción `ACTIVO` del mismo niño, tanto en `create` como al pasar a `ACTIVO` en `update`, y rechazar con mensaje explícito
- [x] 5.4 Rechazar días repetidos en `scheduleDays` antes de escribir, para que el error sea un 400 claro y no un `P2002` del índice único
- [x] 5.5 Resolver los `areaIds` contra el catálogo y rechazar con 400 los que no existan
- [x] 5.6 Implementar `update()` con reemplazo completo de agenda y áreas cuando se envían, y recálculo de `endDate` si llega `startDate` o `durationDays`
- [x] 5.7 Mantener la asignación de `endDate` a hoy al dejar de estar `ACTIVO`, y usarla cuando el cliente no mande una fecha explícita
- [x] 5.8 Implementar `getById()` con niño, áreas, agenda y pagos incluidos, más los totales
- [x] 5.9 Implementar `getPrefill()` con la inscripción más reciente del niño devolviendo `monthlyFee`, `startDate` (su `endDate`), `areaIds` y `scheduleDays`; 404 si no hay
- [x] 5.10 Tests de `create`: éxito transaccional, día duplicado, niño con `ACTIVO`, área inexistente, niño inexistente y que un fallo en el pago inicial no deja inscripción creada

## 6. Service: lectura agrupada

- [x] 6.1 Reimplementar `findAll()` para devolver `{ groups, meta }`, filtrando por `search`, `status` y `childId`, y paginando por niños
- [x] 6.2 Calcular `meta.total` contando niños distintos que tengan inscripciones coincidentes, no el número de inscripciones
- [x] 6.3 Traer agenda, áreas y pagos de las inscripciones en la misma consulta con `include` (sin N+1) y calcular los totales en memoria
- [x] 6.4 Ordenar las inscripciones de cada grupo por `startDate desc` y los grupos por apellido/nombre del niño
- [x] 6.5 Actualizar `findByChild()` para devolver también los totales por inscripción
- [x] 6.6 Test de agrupación: dos inscripciones del mismo niño en un grupo, suma de la cabecera, `meta.total` contando niños, y filtro por estado/búsqueda en el `where`

## 7. Pagos

- [x] 7.1 Mantener la validación del pago inicial en `EnrollmentsService.assertPayment`; `PaymentsService` conserva su propia validación de `periodStart <= periodEnd` para no acoplar módulos
- [x] 7.2 Actualizar los DTOs de pago para el enum nuevo y quitar `TARJETA` y `CHEQUE` de cualquier lista
- [x] 7.3 Confirmar que `getPendingPayments` sigue funcionando sin cambios, dado que no depende del enum

## 8. Frontend: tipos y cliente

- [x] 8.1 Agregar a `types/enrollment.ts`: `Shift`, `ScheduleDay`, `EnrollmentTotals`, `EnrollmentGroup`, `ListEnrollmentsResponse`, `EnrollmentPrefill`, y los campos nuevos de `Enrollment`
- [x] 8.2 Reescribir `lib/api/enrollments.ts` para consumir la forma agrupada y agregar `getEnrollment(id)` y `getEnrollmentPrefill(childId)`
- [x] 8.3 Actualizar `types/payment.ts` al enum `EFECTIVO | QR | TRANSFERENCIA`
- [x] 8.4 Revisar los puntos que suman `monthlyFee` o `amount` sin coerción y verificar que ahora reciben números

## 9. Frontend: formulario

- [x] 9.1 Quitar el selector de niño de `enrollment-form.tsx` y tomar el nombre del niño como dato fijo del encabezado
- [x] 9.2 Reordenar el formulario: fecha de inscripción, duración en días, días y turno, áreas, monto, pago inicial
- [x] 9.3 Agregar la duración en días y mostrar la fecha de fin calculada en solo lectura a partir de `startDate + durationDays`
- [x] 9.4 Dejar de enviar `endDate` desde el cliente
- [x] 9.5 Implementar una fila por día con selector de turno ("No asiste" / todo el día / mañana / tarde), con un solo turno por día
- [x] 9.6 Agregar el selector múltiple de áreas desde `GET /areas`
- [x] 9.7 Agregar la sección de pago inicial con monto, método y período
- [x] 9.8 Prefill de monto, áreas, agenda y fecha desde `GET /enrollments/child/:childId/prefill`, editable, con la fecha propuesta como el `endDate` de la anterior
- [x] 9.9 Advertir en el formulario cuando el niño ya tiene una inscripción activa, sin cerrarla automáticamente
- [x] 9.10 Enviar `scheduleDays` solo con los días marcados y `areaIds` solo con las áreas seleccionadas

## 10. Frontend: páginas

- [x] 10.1 Reescribir `enrollments/page.tsx` como listado agrupado por niño, sin alta, con buscador, filtro por estado y paginación
- [x] 10.2 Mostrar cabecera de grupo con foto, nombre, totales, y cada inscripción con período, estado, monto, saldo y chips de día/turno
- [x] 10.3 Resaltar visualmente el saldo mayor a cero
- [x] 10.4 Crear `enrollments/[id]/page.tsx` con datos, áreas, agenda, totales e historial de pagos
- [x] 10.5 Enlazar el nombre del niño en el detalle a su expediente
- [x] 10.6 Mostrar el mensaje de "no encontrada" en el detalle ante un 404
- [x] 10.7 Actualizar `children/[id]/page.tsx` para mostrar cada inscripción como tarjeta con chips, áreas, saldo y enlace al detalle
- [x] 10.8 Adaptar `dashboard/page.tsx` a la forma agrupada (`groups.flatMap`)
- [x] 10.9 Actualizar `payment-form.tsx` al enum nuevo, conservando los defaults que ya tenía

## 11. Documentación y verificación

- [x] 11.1 Reescribir §5 de `project.md` con duración, agenda por día y turno, áreas, saldo y pago inicial
- [x] 11.2 `cd backend && npm run lint && npm run build`
- [x] 11.3 `cd fronted && npm run lint && npm run build`
- [x] 11.4 `openspec validate enrollment-schedule-balance-and-detail --type change --strict`
- [x] 11.5 `curl` como ADMIN: `POST /enrollments` con `durationDays`, agenda, áreas y pago inicial devuelve 201 con `endDate` calculado
- [x] 11.6 `curl` un segundo alta `ACTIVO` para el mismo niño y comprobar que devuelve 400
- [x] 11.7 `curl` `GET /enrollments` y comprobar la forma `{ groups, meta }` y que `facturado`/`pagado`/`saldo` son números
- [x] 11.8 `curl` `GET /enrollments/:id` y comprobar agenda, áreas, pagos y totales
- [x] 11.9 `curl` `GET /enrollments/child/:childId/prefill` para un niño con inscripción anterior y para uno sin ella
- [x] 11.10 `curl` `GET /payments/pending` antes y después de los cambios para confirmar que no se rompió
- [x] 11.11 Verificar que `PATCH /enrollments/:id` con `childId` devuelve 400 y que sin él funciona
- [x] 11.12 Verificar en `/enrollments` y en el dashboard que los saldos coinciden con `GET /enrollments`
