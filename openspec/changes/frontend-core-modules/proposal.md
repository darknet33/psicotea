## Why

El backend ya expone los modulos core (Children, Enrollments, Payments) y el perfil de usuario, pero el frontend todavia no tiene pantallas para gestionarlos: los unicos flujos operativos visibles son login y dashboard con estadisticas estaticas. Sin estas paginas el sistema no se puede usar en el dia a dia.

## What Changes

- **Paginas de ninos** (`/children`): listado con busqueda y filtros, registro/edicion y expediente/detalle del nino con datos del tutor embebidos. El ESPECIALISTA ve la seccion en modo solo lectura (unicamente sus asignados).
- **Paginas de inscripciones** (`/enrollments`): listado, alta y detalle con cambio de estado (ACTIVO/INACTIVO/RETIRADO).
- **Paginas de pagos** (`/payments`): listado, registro de pago, vista de pendientes agrupada por nino e historial por nino desde el expediente.
- **Cuenta real del dashboard**: las tarjetas de "Ninos activos", "Inscripciones" y "Pagos registrados" consumen la API; la de "Asistencias de hoy" queda estatica hasta que exista el modulo Attendance (Fase 6).
- **Base reutilizable**: cliente API tipado para las 3 entidades, tipos de dominio y componente `DataTable` reutilizable (shadcn table) con estados de carga/vacio y accesibilidad.

## Capabilities

### New Capabilities

- `children-pages`: listado con busqueda/filtros, formulario de alta/edicion con tutor embebido y expediente del nino; acceso read-only para ESPECIALISTA de sus asignados y CRUD para ADMIN/PERSONAL_ADMINISTRATIVO.
- `enrollments-pages`: listado, alta y detalle de inscripciones con cambio de estado (ACTIVO/INACTIVO/RETIRADO) y `endDate` automatico.
- `payments-pages`: listado, registro de pagos, vista de pendientes agrupada por nino/historial por nino.
- `dashboard-stats`: tarjetas del dashboard (`/dashboard`) conectadas a los endpoints existentes (children/enrollments/payments).

### Modified Capabilities

- (ninguna)

## Impact

- `fronted/src/app/(dashboard)/children/` (list, new, [id])
- `fronted/src/app/(dashboard)/enrollments/` (list, [id])
- `fronted/src/app/(dashboard)/payments/` (list, pending)
- `fronted/src/app/(dashboard)/dashboard/page.tsx` (stats reales) y `fronted/src/app/(dashboard)/page.tsx` (redireccion, si aplica)
- Componentes: `components/data-table.tsx`, `components/forms/child-form.tsx`, `components/forms/enrollment-form.tsx`, `components/forms/payment-form.tsx`
- Capa de datos: `types/child.ts`, `types/enrollment.ts`, `types/payment.ts`, `lib/api/children.ts`, `lib/api/enrollments.ts`, `lib/api/payments.ts`
- `components/layout/sidebar.tsx`: "Ninos" visible para ESPECIALISTA (solo lectura)
- Dependencia nueva: componente `table` de shadcn/ui
- Sin cambios en el backend (consume la API existente)