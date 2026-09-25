## Why

El expediente de un niño limita el contacto a **un solo tutor embebido** en `Child`, lo que impide registrar más de un responsable y reutilizar a un mismo tutor entre hermanos/pacientes. Además, el sexo usa valores mixtos (`M | F | Masculino | Femenino`), las fechas se ingresan con `input type="date"` nativo y no se muestra la edad del niño en ningún lugar. Se requiere estandarizar: tutores N:N, sexo `Varón | Mujer`, ingreso de fechas desglosado (Día/Mes/Año) y edad calculada.

## What Changes

- **BREAKING** Modelo de datos de tutor: se eliminan los campos embebidos `parentName`, `parentLastName`, `parentRelationship`, `parentPhone`, `parentEmail`, `parentCarnet` de `Child`. Se introduce la entidad `Tutor` y la relación N:N `ChildTutor` (un niño con muchos tutores; un tutor para varios niños) con `relationship` (parentesco) y `isPrimary` (tutor principal).
- **BREAKING** Valores de `sex` restringidos a `Varón | Mujer` (se eliminan `M | F | Masculino | Femenino`).
- Se muestra la **edad calculada** (en años y meses) del niño en el listado de niños y en el expediente.
- Nuevo estándar de ingreso de fecha: selector desglosado **Día / Mes / Año** para todos los campos de fecha (nacimiento, inscripción, inicio de inscripción, fecha de pago y futuros formularios).
- Renombre de campo "Teléfono" a **Celular/WhatsApp** en todos los formularios y vistas del tutor.

## Capabilities

### New Capabilities
- `tutors`: entidad `Tutor` y relación many-to-many con `Child` (parentesco por vínculo, tutor principal), reutilización/deduplicación por `carnet`, gestión embebida en el alta/edición del niño y sin cuenta de usuario.
- `date-inputs`: estándar de ingreso de fecha desglosado (Día/Mes/Año) aplicable a todos los formularios actuales y futuros que capturen fechas.

### Modified Capabilities
- `children`: cambia el registro de niños (tutores N:N en lugar de tutor embebido), los valores de `sex` (`Varón | Mujer`), la edad calculada en listado y expediente, y la etiqueta Celular/WhatsApp.

## Impact

- **Backend**: `backend/prisma/schema.prisma` (modelos `Tutor`, `ChildTutor`, cambio de `Child`), migración Prisma, `children.service.ts`, DTOs `create/update-child.dto.ts`, `seed.ts`.
- **Frontend**: `fronted/src/types/child.ts`, `lib/format.ts` (helper de edad), nuevo componente `date-selects`, `child-form.tsx` (filas dinámicas de tutores + fecha desglosada + Varón/Mujer), `enrollment-form.tsx` y `payment-form.tsx` (fechas desglosadas), páginas `children`, `children/[id]` y `children/[id]/edit`.
- **API**: contrato de `POST/PATCH /children` cambia (`parent*` → `tutors[]`); respuesta de `GET /children` y `GET /children/:id` incluye `tutors` y edad derivada de `dateOfBirth`.
- **BD**: base de datos de niños/pagos/inscripciones actualmente vacía tras limpieza; la migración es limpia.