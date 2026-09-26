## Why

Hoy el niño se identifica solo por nombre y la foto vive como dato suelto: no hay un identificador propio del niño, ni un documento que el padre pueda mostrar, y la asistencia se registra manualmente sin forma de verificar que el niño presente es quien dice ser.

Una credencial con carnet, foto y QR resuelve las tres cosas a la vez: da al niño un identificador propio, le da al padre un documento verificable, y habilita el registro de asistencia por escaneo sin listas manuales.

## What Changes

- **BREAKING**: `Child` incorpora un campo `carnet` obligatorio y único. `POST /children` y `PATCH /children/:id` lo exigirán; los registros existentes se rellenan con un valor generado (`LEGACY-<id>`) en la migracion.
- `Child` incorpora `credentialCode`: un token opaco firmado (aleatorio + HMAC-SHA256 con `CREDENTIAL_SECRET`) que identifica al nino en la credencial, en la pagina publica y en el escaneo de asistencia.
- Nueva vista de **credencial imprimible** en el detalle del nino: tarjeta con foto, nombre, carnet, QR y datos del tutor principal, optimizada para imprimir o guardar como PDF desde el navegador.
- Nuevo **endpoint publico sin autenticacion** `GET /public/children/credential/:code` que devuelve solo datos principales del nino (nombre completo, edad, foto, tutor principal con telefono y direccion) y el listado de informes (titulo y periodo). No expone diagnostico, ni contenido clinico de informes, ni pagos, ni otros tutores.
- Nueva **ruta publica** `/publico/nino/[code]` en el frontend, sin sesion requerida, que consume ese endpoint.
- Nuevo **escaneo de asistencia por QR** `POST /attendance/scan`, protegido por JWT y rol, que valida la firma del token y registra la asistencia del dia de forma idempotente. Acepta tanto el codigo suelto como la URL completa escaneada.
- Nueva vista de **asistencia** en el frontend con lector de camara y entrada manual del codigo como alternativa.
- El endpoint publico aplica limitacion de tasa para impedir enumeracion por fuerza bruta del token.

## Capabilities

### New Capabilities
- `child-credential`: carnet obligatorio y unico del nino, emision de un token de credencial firmado, y vista de credencial imprimible con foto y QR.
- `public-child-portal`: endpoint y pagina publica sin autenticacion que exponen un subconjunto acotado de datos del nino para consulta de los padres.
- `qr-attendance`: registro de asistencia por escaneo de QR, restringido a usuarios del sistema y validado mediante token firmado.

### Modified Capabilities
- `children`: el registro del nino ahora exige `carnet` como dato obligatorio y unico (BREAKING).

## Impact

- **Datos / migracion**: `Child.carnet` (String, `@unique`, obligatorio), `Child.credentialCode` (String, `@unique`). Backfill de `carnet` para filas existentes. Nueva variable de entorno `CREDENTIAL_SECRET` en el backend.
- **Backend**: `children` (DTO, service, validacion, seed), nuevo modulo `public` sin `JwtAuthGuard`, nuevo endpoint de escaneo en asistencia, `common` (servicio de firma HMAC), `app.module` y `main` (configuracion).
- **Frontend**: `types/child.ts`, `child-form.tsx`, detalle de nino, nuevo route group `(public)` con `/publico/nino/[code]`, nueva vista de credencial, nueva vista de asistencia, cliente HTTP. No hace falta tocar `middleware` ni `next.config`: la proteccion vive en el layout de `(dashboard)`.
- **Dependencias nuevas**: `react-qr-code` (render SVG del QR) y `html5-qrcode` (lector de codigos con la camara) en el frontend.
- **Sistema**: la ruta publica queda expuesta sin autenticacion; su exposicion queda limitada por el diseno del DTO y por la limitacion de tasa.
