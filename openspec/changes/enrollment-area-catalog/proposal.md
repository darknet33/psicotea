## Why

Hoy las inscripciones no registran en qué áreas atiende el niño: el campo "servicio o modalidad" que pedía `project.md` §5 nunca se implementó, y `Enrollment` no tiene ninguna relación con un catálogo de áreas. Cuando el centro trabaja por áreas (lenguaje, terapia ocupacional, intervención conductual, etc.), el personal no puede responder "¿en qué áreas está el niño?", no puede filtrar, y las áreas quedan perdidas en notas libres de texto.

Además no existe ningún catálogo administrable: cada persona escribe el texto de forma ligeramente distinta, así que cualquier reporte o filtro por área sería imposible.

Este change agrega el catálogo de áreas y su relación con las inscripciones. La duración, agenda, saldo y detalle de inscripción se resuelven en `enrollment-schedule-balance-and-detail`, que depende de esta capacidad.

## What Changes

- **Nueva entidad `Area`**: `name` (único), `description` (opcional), `isActive`. Sin borrado físico: se desactiva, para no romper las inscripciones históricas que la referencian.
- **Relación N:N `EnrollmentArea`**: una inscripción puede abarcar varias áreas y un área puede estar en muchas inscripciones.
- **Endpoints de áreas** protegidos por JWT:
  - `GET /areas` — listado, con filtro `?includeInactive=true`
  - `GET /areas/:id` — detalle
  - `POST /areas` — crear
  - `PATCH /areas/:id` — editar (incluye activar/desactivar)
- **Gestión restringida a ADMIN**: `POST /areas` y `PATCH /areas/:id` devuelven 403 para `PERSONAL_ADMINISTRATIVO` y `ESPECIALISTA`. El `GET` sí queda abierto a los roles que ya gestionan inscripciones (`ADMIN`, `PERSONAL_ADMINISTRATIVO`), porque el formulario de inscripción necesita listarlas.
- **Página `/areas`** en el frontend, con entrada en el sidebar visible solo para ADMIN: listado, alta, edición y activar/desactivar.
- No se toca todavía el formulario de inscripción: el enganche de las áreas al flujo de alta/inscripción llega con `enrollment-schedule-balance-and-detail`.

## Capabilities

### New Capabilities
- `areas`: catálogo de áreas de trabajo del centro (CRUD, control de acceso, desactivación sin borrado) y su página de administración.

### Modified Capabilities

Ninguna. Este change no altera requisitos de ninguna spec existente: `enrollment-schedule-balance-and-detail` es quien agrega la relación `Enrollment ↔ Area` a la spec de inscripciones.

## Impact

- **Base de datos**: tablas nuevas `Area` y `EnrollmentArea`; la relación de `Enrollment` hacia `Area` queda disponible para el siguiente change.
- **Backend**: módulo nuevo `backend/src/areas/` (controller, service, DTOs) registrado en `app.module.ts`; reutiliza `JwtAuthGuard`, `RolesGuard` y el decorador `@Roles`.
- **Frontend**: página nueva `fronted/src/app/(dashboard)/areas/page.tsx`, entrada en `fronted/src/components/layout/sidebar.tsx`, cliente `fronted/src/lib/api/areas.ts` y tipos `fronted/src/types/area.ts`.
- **Seed**: se crea un conjunto inicial de áreas para que el catálogo no arranque vacío. No es destructivo: solo inserta las que falten.
- **Dependencias**: ninguna nueva.
- **Datos existentes**: no se modifican. Las inscripciones actuales quedan sin áreas, lo cual es un estado válido (las áreas son opcionales).
