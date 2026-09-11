## 1. Base reutilizable

- [x] 1.1 Crear componente `table` de shadcn en `fronted/src/components/ui/table.tsx` (sin radix, espejo del resultado de `shadcn add table`)
- [x] 1.2 Crear tipos de dominio en `fronted/src/types/child.ts` (Child con tutor embebido, QueryChild) y `types/enrollment.ts` + `types/payment.ts` como espejo de los DTOs/Prisma (incluye enums EnrollmentStatus y PaymentMethod)
- [x] 1.3 Crear cliente API tipado `fronted/src/lib/api/children.ts` (list/create/update/remove con query params de busqueda y filtros)
- [x] 1.4 Crear cliente API tipado `fronted/src/lib/api/enrollments.ts` (list/create/updateStatus) y `lib/api/payments.ts` (list/create/pending/byChild)
- [x] 1.5 Crear `fronted/src/components/data-table.tsx` generico: columnas declarativas, estados carga (Skeleton)/vacio/error con "Reintentar", soporte de search/filter via callbacks

## 2. Paginas de ninos (children-pages)

- [x] 2.1 Crear pagina `fronted/src/app/(dashboard)/children/page.tsx` (lista con DataTable, busqueda, filtro isActive, boton "Nuevo nino" solo para ADMIN/PERSONAL, estados vacio/error)
- [x] 2.2 Crear formulario reutilizable `fronted/src/components/forms/child-form.tsx` con react-hook-form + zod (datos del nino + tutor embebido + specialistId opcional, reglas equivalentes a DTOs)
- [x] 2.3 Crear pagina alta `fronted/src/app/(dashboard)/children/new/page.tsx` (POST /children, navega al expediente, toasts con getErrorMessage)
- [x] 2.4 Crear pagina edicion `fronted/src/app/(dashboard)/children/[id]/edit/page.tsx` (PATCH /children/:id) y acciones editar/eliminar segun rol en el expediente
- [x] 2.5 Crear expediente `fronted/src/app/(dashboard)/children/[id]/page.tsx` con secciones: datos del nino, tutor, inscripciones e historial de pagos (incluidos en GET /children/:id del detalle)
- [x] 2.6 Agregar "Ninos" al sidebar para ESPECIALISTA (solo lectura: sin crear/editar/eliminar) y ocultar acciones en la UI segun `user.role`

## 3. Paginas de inscripciones (enrollments-pages)

- [x] 3.1 Crear pagina `fronted/src/app/(dashboard)/enrollments/page.tsx` (DataTable con filtro por estado, badge ACTIVO/INACTIVO/RETIRADO)
- [x] 3.2 Crear formulario `fronted/src/components/forms/enrollment-form.tsx` (selector de nino, startDate, monthlyFee obligatoria, notes) y alta via Dialog/POST
- [x] 3.3 Implementar cambio de estado con confirmacion (PATCH /enrollments/:id): ACTIVO/INACTIVO/RETIRADO y reflejar `endDate` automatico (toast)

## 4. Paginas de pagos (payments-pages)

- [x] 4.1 Crear pagina `fronted/src/app/(dashboard)/payments/page.tsx` (DataTable con nino, monto, metodo, fecha, periodo)
- [x] 4.2 Crear formulario `fronted/src/components/forms/payment-form.tsx` (selector de nino, amount, paymentDate, method, periodStart/periodEnd, reference/description) y alta via Dialog/POST
- [x] 4.3 Crear vista `fronted/src/app/(dashboard)/payments/pending/page.tsx` (GET /payments/pending agrupada por nino con periodos YYYY-MM y montos, enlace a registrar cobro, estado vacio sin deudas)
- [x] 4.4 Integrar historial de pagos y acceso a registro desde el expediente del nino (reuso 2.5/4.2)

## 5. Dashboard y cierre

- [x] 5.1 Conectar tarjetas de `/dashboard` a la API (ninos activos, inscripciones, pagos del mes con formato moneda; skeleton y degradacion por tarjeta ante error; "Asistencias de hoy" estatica hasta Fase 6)
- [x] 5.2 `npm run build` + `npm run lint` en `fronted/` (sin E2E; verificacion corta)
- [x] 5.3 Marcar tareas 5.1-5.14 si procede en `architecture-stack-definition/tasks.md` y validar `openspec validate frontend-core-modules`