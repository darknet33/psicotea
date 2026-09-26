## 1. Backend — Modelo y migración

- [x] 1.1 Actualizar `backend/prisma/schema.prisma`: en `Child`, renombrar `photo` → `photoUrl String` (no nulo) y agregar `diagnostico String` (no nulo); eliminar `enrollmentDate`; en `Tutor` agregar `address String?`.
- [x] 1.2 Crear migración Prisma (`prisma migrate dev --name child-photo-diagnosis`) con backfill de `photoUrl` (placeholder) para filas existentes antes del `NOT NULL`.
- [x] 1.3 Ejecutar `prisma generate` y verificar el cliente regenerado.
- [x] 1.4 Agregar `uploads/` al `.gitignore` del backend y `UPLOAD_DIR` a `backend/.env` y `.env.example`.

## 2. Backend — Módulo de subida de fotos

- [x] 2.1 Crear `backend/src/uploads/uploads.module.ts` y `uploads.controller.ts` con `POST /uploads/image` usando `FileInterceptor('file')` + `diskStorage` hacia `UPLOAD_DIR`.
- [x] 2.2 Configurar `fileFilter` (solo `image/jpeg|png|webp`) y `limits.fileSize` (5 MB); mapear errores Multer a 400/413.
- [x] 2.3 Nombre de archivo único (timestamp + aleatorio + extensión saneada) y respuesta `{ url }` absoluta (protocol + host del request).
- [x] 2.4 Proteger el endpoint con el guard JWT existente (roles ADMIN y PERSONAL_ADMINISTRATIVO).
- [x] 2.5 En `backend/src/main.ts`: `NestFactory.create<NestExpressApplication>` y `app.useStaticAssets(uploadsDir, { prefix: '/uploads/' })`.

## 3. Backend — DTOs y servicio

- [x] 3.1 En `backend/src/children/dto/create-child.dto.ts`: `photoUrl` obligatorio con validación de URL, agregar `diagnostico` obligatorio, eliminar `enrollmentDate`.
- [x] 3.2 En `backend/src/children/dto/update-child.dto.ts`: idem (opcional en update, URL válida si se envía), eliminar `enrollmentDate`.
- [x] 3.3 En `backend/src/children/dto/child-tutor.dto.ts`: agregar `address` opcional.
- [x] 3.4 En `backend/src/children/children.service.ts`: usar `photoUrl`/`diagnostico` en `create` y `update`, eliminar referencias a `enrollmentDate`, y exponer `address` en `serializeTutors` y `upsertTutors`.
- [x] 3.5 Actualizar `backend/prisma/seed.ts`: `photoUrl` y `diagnostico` en niños; `address` en algunos tutores.

## 4. Frontend — Control de foto (drag & drop + cámara)

- [x] 4.1 Crear `fronted/src/components/forms/photo-upload.tsx`: zona drag & drop, click para explorar, botón "Usar cámara" (getUserMedia + captura a canvas con fallback `<input capture>`), previsualización y estado de carga.
- [x] 4.2 Compresión/redimensión client-side (canvas, máx 1280px, JPEG q=0.8) antes de subir.
- [x] 4.3 Subida a `POST /uploads/image` con `FormData` reutilizando el token JWT; llamar `onChange(url)` con la URL devuelta y limpiar object URLs.
- [x] 4.4 Mensajes de error para archivo no imagen / muy pesado / permiso de cámara denegado.

## 5. Frontend — Tipos, formulario y pantallas

- [x] 5.1 En `fronted/src/types/child.ts`: `Child` y `ChildInput` pasan `photo` → `photoUrl: string` (obligatorio), agregan `diagnostico: string` y eliminan `enrollmentDate`; `ChildTutor` y `ChildTutorInput` agregan `address?`.
- [x] 5.2 En `fronted/src/components/forms/child-form.tsx`: esquema zod — `photoUrl` obligatorio (URL), `diagnostico` obligatorio, tutor con `address` opcional; eliminar `enrollmentDate`; integrar `<PhotoUpload>` vía `Controller` para `photoUrl`; mapear campos en `toValues` y `handleFormSubmit`.
- [x] 5.3 En `fronted/src/app/(dashboard)/children/[id]/page.tsx`: mostrar `diagnostico`, `photoUrl` y `address` del tutor; eliminar uso de `enrollmentDate`.
- [x] 5.4 En `fronted/src/app/(dashboard)/children/page.tsx` y pantallas `new`/`edit`: ajustar listado y paso de `ChildInput`; eliminar `enrollmentDate`.
- [x] 5.5 Buscar otros consumidores de `enrollmentDate` y `\.photo\b` en `fronted/src` y ajustarlos.

## 6. Verificación

- [x] 6.1 `npx tsc --noEmit` y lint sin errores en `backend/`.
- [x] 6.2 `npx tsc --noEmit` y lint sin errores en `fronted/`.
- [ ] 6.3 Probar `POST /uploads/image`: sin token → 401; tipo no imagen → 400; >5MB → 413; imagen válida → 201 con URL accesible por `GET /uploads/<nombre>`.
- [ ] 6.4 Probar `POST /children` y `PATCH /children/:id`: sin `photoUrl`/`diagnostico` → 400; correcto → 201/200 incluyendo `photoUrl`, `diagnostico` y `address` de tutores.
- [ ] 6.5 Verificar en UI: drag & drop y cámara generan la foto, previsualizan y guardan; tutor con dirección se envía y se muestra.