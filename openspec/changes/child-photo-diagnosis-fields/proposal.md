## Why

Al registrar o actualizar un niño, el sistema necesita una foto obligatoria y un diagnóstico: son datos clínicos básicos del expediente. La foto debe capturarse desde el frontend con un componente drag & drop y con la cámara del dispositivo, persistida subiendo el archivo al backend (no pegar una URL externa). Además, cada tutor lleva una dirección (domicilio) para el expediente. `enrollmentDate` en `Child` es redundante con `enrollments.startDate`.

## What Changes

- **BREAKING**: `photo` pasa a **`photoUrl` obligatorio** (URL del servidor) en registro y actualización de niño.
- **Nuevo** endpoint `POST /uploads/image` (multipart) que valida tipo/tamaño, guarda el archivo en disco y devuelve una URL servida estáticamente por el backend (`/uploads/*`).
- **Nuevo** en el frontend: componente de foto con **drag & drop**, botón para explorar archivos y **opción de cámara** del dispositivo; comprime/redimensiona en el cliente, sube al backend y produce la `photoUrl`. Reemplaza la entrada manual de URL.
- Se agrega el campo `diagnostico` (texto) obligatorio a registro y actualización de niño.
- **BREAKING**: se elimina `enrollmentDate` del modelo `Child`, DTOs, formulario y pantallas. La fecha de inscripción queda sólo como `Enrollment.startDate`.
- En tutores se agrega el campo `address` (dirección, opcional) en backend y frontend.

## Capabilities

### New Capabilities
- `photo-upload`: Endpoint de subida de imágenes (multipart) autenticado que valida tipo/tamaño, guarda el archivo en disco y devuelve una URL servida estáticamente por el backend.

### Modified Capabilities
- `children`: el registro/actualización exige `photoUrl` (URL de subida) obligatoria y agrega `diagnostico` obligatorio; elimina `enrollmentDate`; los tutores incorporan `address` (dirección) opcional. El formulario de niño usa drag & drop y cámara para generar la foto.

## Impact

- `backend/prisma/schema.prisma` — modelo `Child` (agregar `diagnostico`, `photo`→`photoUrl` nulo-no, eliminar `enrollmentDate`) y modelo `Tutor` (agregar `address`); migración Prisma.
- `backend/prisma/seed.ts` — datos de ejemplo con `photoUrl` y `address`.
- `backend/src/children/dto/*` — `CreateChildDto`, `UpdateChildDto`, `ChildTutorDto`.
- `backend/src/children/children.service.ts` — creación/actualización y serialización de tutores.
- `backend/src/main.ts` — servir estáticamente `uploads/`.
- `backend/src/uploads/**` — nuevo módulo de subida (multer).
- `backend/uploads/` — carpeta de archivos (agregar a `.gitignore`).
- `fronted/src/types/child.ts` — tipos `Child`, `ChildInput`, `ChildTutor`, `ChildTutorInput`.
- `fronted/src/components/forms/child-form.tsx` — esquema zod, campos, submit.
- `fronted/src/components/forms/photo-upload.tsx` — **nuevo** componente drag & drop + cámara.
- `fronted/src/app/(dashboard)/children/**` — listado, expediente y edición.