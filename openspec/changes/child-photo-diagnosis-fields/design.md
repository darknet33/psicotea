## Context

El modelo `Child` en `backend/prisma/schema.prisma` tiene hoy `photo String?` (opcional) y `enrollmentDate DateTime` (obligatorio), y carece de diagnóstico. `Tutor` no tiene dirección. El módulo `enrollments` ya posee `startDate`. No existe infraestructura de subida de archivos ni servido estático en el backend. El frontend (`fronted/src/types/child.ts`, `fronted/src/components/forms/child-form.tsx`) refleja los mismos campos y debe alinearse. Decisión del equipo: la foto se sube como archivo al backend (no data URL ni URL externa).

## Goals / Non-Goals

**Goals:**
- Hacer `photoUrl` obligatorio (URL del servidor) en registro y actualización, backend y frontend.
- Subir la imagen al backend con validación de tipo/tamaño y servirla estáticamente.
- Control de foto en frontend con drag & drop, selección de archivo y cámara (que produce la `photoUrl`).
- Agregar `diagnostico` obligatorio a `Child`.
- Agregar `address` (opcional) a los tutores, backend y frontend.
- Eliminar `enrollmentDate` del niño; la inscripción queda en `enrollments.startDate`.

**Non-Goals:**
- No se crea galería, edición de imagen ni múltiples fotos por niño.
- No se agregan dependencias nuevas: Multer ya viene con `@nestjs/platform-express` y el servido estático usa `useStaticAssets` de `NestExpressApplication`.
- No se tratan cambios al módulo de `enrollments`.

## Decisions

- **`photo` → `photoUrl` (`String`, no nulo).** Nombre explícito de URL, coherente con `pdfUrl`/`receiptUrl` existentes.
- **Subida con Multer (`FileInterceptor`) + `diskStorage`.** Guarda en `backend/uploads` (configurable por env `UPLOAD_DIR`). Filename único: `Date.now()` + sufijo aleatorio + extensión saneada a partir del mimetype. `fileFilter` acepta solo `image/jpeg|png|webp`; `limits.fileSize = 5MB`. Errores de Multer se mapean (400 tipo inválido, 413 tamaño).
- **Servido estático sin dependencia nueva:** `NestFactory.create<NestExpressApplication>(AppModule)` y `app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' })` en `main.ts`. El CORS ya refleja el origin, así que las imágenes cargan desde la IP LAN.
- **URL absoluta en respuesta:** se compone con `req.protocol` y `req.get('host')` → `http://10.80.218.1:3001/uploads/xxx.jpg`, alcanzable por el frontend en red.
- **Autenticación:** el endpoint `POST /uploads/image` usa el guard JWT existente (roles ADMIN y PERSONAL_ADMINISTRATIVO, igual que la creación de niños). El estático `/uploads/*` es público (imagen de expediente).
- **Control frontend `photo-upload.tsx`:** zona drag & drop + click para explorar; botón "Usar cámara" (getUserMedia con preview de video y captura a canvas) con fallback a `<input type="file" accept="image/*" capture>` en móvil. Antes de subir se redimensiona/comprime en el cliente (canvas, máx 1280px, JPEG q=0.8) para reducir payload/riesgo de 413. Previsualización con object URL; durante la subida se muestra estado de carga; al recibir la URL se invoca `onChange(url)` (integración vía `Controller` en `child-form.tsx`).
- **`diagnostico` como `String` obligatorio.** Texto libre (clasificación del especialista); requerido en create y update.
- **Tutor `address` opcional (`String?`).** Persistido en `Tutor` (reutilizable entre niño y niño por `carnet`), expuesto en `ChildTutorDto`, serialización del service y tipos del frontend.
- **Frontend zod:** `childSchema` exige `photoUrl` (URL válida) y `diagnostico`; `tutorSchema` agrega `address` opcional; se elimina `enrollmentDate` de esquema, `defaultValues` y controles; `handleFormSubmit` mapea los campos nuevos.
- **Seed:** los niños de ejemplo usan una `photoUrl` pública y un `diagnostico`; algunos tutores con `address`.

## Risks / Trade-offs

- **Rotura de consumidores de `enrollmentDate`/`photo` en frontend** → se actualizan tipos primero y se corre `tsc --noEmit` para cazar todos los usos.
- **`photo` ya almacenada en filas existentes** → la migración hace `photoUrl` obligatorio; riesgo de fallo con filas vacías. Mitigación: backfill con una imagen placeholder antes del `NOT NULL`.
- **Archivos subidos sin limpieza** → se acepta por ahora (fotos pequeñas tras compresión); el `uploads/` va a `.gitignore`.
- **Cámara requiere HTTPS o localhost** → en la IP LAN se sirve por HTTP; en móvil el `input[type=file][capture]` no exige permisos; el getUserMedia solo se ofrece cuando el contexto lo permite y se muestra error amigable si el permiso es denegado.
- **Estático público** → las fotos del expediente no tendrán auth; aceptado por el alcance actual (se puede endurecer con tokens firmados en otra iteración).
- **Servidor tras proxy** → la URL absoluta usaría el host del request; en la LAN local es correcto; si hay proxy se configuraría `UrlGenerator` con base fija.

## Migration Plan

1. Migración Prisma: agregar `diagnostico String`, renombrar `photo`→`photoUrl`, backfill placeholder, `NOT NULL`; eliminar `enrollmentDate`; agregar `Tutor.address String?`.
2. `prisma generate` y `prisma migrate deploy`.
3. Crear módulo `uploads` en backend + estático en `main.ts` + `UPLOAD_DIR` en `.env`.
4. Actualizar DTOs, service, seed.
5. Actualizar tipos, `photo-upload.tsx` y `child-form.tsx`; limpiar pantallas de `enrollmentDate`.
6. Rollback: revertir migración solo si no se liberó a producción; borrar carpeta uploads al revertir.

## Open Questions

- ¿`diagnostico` es texto libre o lista cerrada? Se asume libre por ahora.
- ¿Limpiar fotos huérfanas al reemplazar en edición? Se asume que no por ahora (se conservan).