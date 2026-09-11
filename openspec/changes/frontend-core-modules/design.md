# Design: Frontend Core Modules

## Context

El backend (NestJS/Prisma) ya expone los modulos Children, Enrollments y Payments con RBAC por rol (`user-roles`), auth JWT con refresh en el interceptor de Axios y un frontend Next.js 16 (Turbopack) con shadcn/ui, Zustand para auth y react-hook-form + zod como patron de formularios. Actualmente solo existen `/login`, `/dashboard` (estatico) y `/profile`. Este cambio agrega las pantallas operativas de ninos, inscripciones y pagos, conecta el dashboard a la API y reutiliza los componentes y patrones existentes.

Restricciones aplicadas:
- Patron de formularios: react-hook-form + zodResolver + toast `sonner` con `getErrorMessage` (igual que login/profil).
- Interceptor de JWT ya implementado en `lib/axios.ts` (no tocar).
- Componentes UI de `components/ui/*`; no se agregan dependencias salvo shadcn `table`.
- Debe consultarse `node_modules/next/dist/docs/` antes de escribir codigo (AGENTS.md).
- El ESPECIALISTA ve Ninos solo lectura (sus asignados); no ve Inscripciones ni Pagos.

## Goals / Non-Goals

**Goals:**
- Listado con busqueda/filtros, alta/edicion y expediente de ninos (`/children`, `/children/new`, `/children/[id]`).
- Inscripciones: listado, alta y cambio de estado (`/enrollments`, `/enrollments/[id]`).
- Pagos: listado, registro y vista de pendientes (`/payments`, `/payments/pending`).
- Dashboard con tarjetas conectadas a la API.
- Capa tipada reutilizable (tipos + cliente API) y componente `DataTable` generico.

**Non-Goals:**
- No se toca el backend (solo consume su API). No atencion/actividades/informes (Fases 6-7).
- No se implementan dashboards por rol (Fase 12) ni exportacion PDF/CSV (Fase 12.7).
- Sin paginacion server-side: los listados consumen los endpoints actuales (filtros por query param); si el volumen crece, ver Riesgos.
- La tarjeta de asistencias del dashboard queda estatica (backend Attendance no existe).

## Decisions

### D1. Cliente API tipado por entidad, sin react-query
Se crean `lib/api/children.ts`, `lib/api/enrollments.ts`, `lib/api/payments.ts` (funciones `fetch*/create*/update*/remove*`) sobre el `api` de axios, y tipos de dominio en `types/{child,enrollment,payment}.ts` como espejo de los DTOs/Prisma. El fetching en paginas usa hooks locales (`useEffect`/`useState`, o un hook `useFetch` minimo).
Alternativa: agregar `@tanstack/react-query` (caching/refetch). Se rechaza para mantener consistencia con el stack actual (sin query library) y evitar dependencias nuevas; el uso actual no justifica el costo.

### D2. DataTable generico con shadcn `table`
Se instala el componente `table` de shadcn (`npx shadcn add table`) y se crea `components/data-table.tsx`: un `DataTable<T>` generico con columnas declarativas, estados de carga (Skeleton), vacio y error con "Reintentar", y soporte opcional de search/filter via callbacks.
Alternativa: tablas caseras con `<div>`s. Se rechaza por accesibilidad y consistencia (aria propio de la tabla HTML, sticky header, etc.).

### D3. Formularios react-hook-form + zod
`components/forms/*` siguen el patron de `login`/`profile`: schema zod (reglas equivalentes a los DTOs backend: fechas ISO, `monthlyFee`/`amount` > 0, `sex` en M/F/Masculino/Femenino, metodos y estados como enums), `zodResolver`, toasts con `getErrorMessage`. En Nino, un campo combinado para apellido del tutor etc.; `specialistId` opcional como select cuando el rol lo permite.

### D4. Rutas y RBAC en la UI
- Paginas son client components bajo `(dashboard)` (ProtectedRoute ya aplica). Se lee `user.role` del store para ocultar acciones (botones) por rol.
- Sidebar (`sidebar.tsx`): se agrega `ESPECIALISTA` a `href: "/children"` (solo lectura); Inscripciones y Pagos quedan ADMIN+PERSONAL (sin cambios).
- El 403 del backend actua como respaldo: `getErrorMessage` lo muestra via toast.

### D5. Dashboard conectado con degradacion
`/dashboard/page.tsx` deja de ser estatico: al montar hace `Promise.all` sobre `children.api.listChildren({isActive:true})`, `enrollments.api.listEnrollments()` y `payments.api.listPayments()`, calcula contadores y total del mes, y muestra skeleton. Ante error de una consulta, la tarjeta muestra "--" y un toast; "Asistencias de hoy" queda con valor 0/estatico. Alternativa de backend dedicado `/stats` se descarta por no requerir cambios de backend ahora.

### D6. Rutas dentro de la app
- `children`: `/children` (lista), `/children/new` (alta), `/children/[id]` (expediente con secciones de inscripciones y pagos).
- Inscripciones/pagos: se gestionan tambien desde el expediente del nino (reuso de historial y registro), ademas de sus paginas propias. Se evita duplicacion de componentes de tabla.

## Risks / Trade-offs

- [Volumen alto de datos sin paginacion server-side] → Mitigacion: filtros por query param alineados al backend; si crece, se agrega paginado en API+fron (tarea futura fuera del alcance).
- [Doble codigo para tabla/forms entre paginas propias y expediente] → Mitigacion: componentes reutilizables (`DataTable`, forms) y seccion historial reusada en expediente.
- [`GET /payments/pending` puede ser pesado en DB] → Mitigacion: se consume tal cual (backend ya resume en memoria); vista orientada a deudores activos.
- [Endpoints requieren ids validos; errores 404/403] → Mitigacion: manejo de error estandar por `getErrorMessage` + toast + estados vacio.
- [ESPECIALISTA: filtrado en backend es por `Specialist.userId`, si no hay perfil devuelve lista vacia] → Mitigacion: la UI trata lista vacia como estado vacio normal.

## Migration Plan

- Solo frontend: agregar `table` de shadcn (`npx shadcn add table`), crear tipos/cliente/componentes y paginas. No hay migracion de datos ni deploy coordinado.
- Rollback: las paginas nuevas no afectan rutas existentes; revertir es borrar/deshacer los archivos nuevos + sidebar.

## Open Questions

- (ninguna pendiente critica; las decisions D1-D6 cubren el alcance del change)