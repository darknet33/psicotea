## 1. Configuracion y dependencias

- [x] 1.1 Agregar `CREDENTIAL_SECRET` al `.env` y `.env.example` del backend con un valor aleatorio de 32 bytes
- [x] 1.2 Instalar `react-qr-code` y `html5-qrcode` en el frontend
- [x] 1.3 Verificar que la autenticacion del frontend solo se aplica en el layout de `(dashboard)` y confirmar que no existe `middleware.ts`

## 2. Migracion de datos

- [x] 2.1 Crear migracion Prisma que agregue `Child.carnet String @unique` y `Child.credentialCode String? @unique`
- [x] 2.2 Incluir en la migracion el backfill de `carnet` con `LEGACY-<id>` para las filas existentes
- [x] 2.3 Aplicar la migracion y verificar que la base de datos local queda consistente
- [x] 2.4 Escribir y ejecutar el script de backfill que genera `credentialCode` firmado para cada nio sin token
- [x] 2.5 Verificar `Child.credentialCode` como NOT NULL en una segunda migracion

## 3. Servicio de token de credencial (backend)

- [x] 3.1 Crear `backend/src/common/credential/credential-token.service.ts` con `generate()` y `verify()`, usando `randomBytes` + HMAC-SHA256 truncado y comparacion con `timingSafeEqual`
- [x] 3.2 Registrar el servicio en un modulo `@Global()` o exportarlo desde `CommonModule` para que `children` y `public` lo usen
- [x] 3.3 Agregar pruebas unitarias de `verify()`: token valido, firma alterada, formato invalido, cadena vacia

## 4. `carnet` obligatorio en el registro de nios (backend)

- [x] 4.1 Agregar `carnet` al DTO de creacion con `@IsNotEmpty()` y `@MaxLength()`
- [x] 4.2 Agregar `carnet` al DTO de actualizacion como opcional
- [x] 4.3 Validar el trim del `carnet` antes de persistir
- [x] 4.4 Detectar `P2002` sobre `Child_carnet_key` y devolver 400 con mensaje de carnet duplicado en vez de 500
- [x] 4.5 Generar el `credentialCode` en `ChildrenService.create` e ignorar cualquier valor enviado por el cliente
- [x] 4.6 Exponer `carnet` y `credentialCode` en los DTO de respuesta de nios
- [x] 4.7 Actualizar el seed con carnets y tokens generados para cada nio
- [x] 4.8 Verificar que `PATCH /children/:id` con el mismo carnet propio no se reporte como duplicado

## 5. Endpoint publico de consulta (backend)

- [x] 5.1 Crear el modulo `backend/src/public/` con controller y service
- [x] 5.2 Implementar `GET /public/children/credential/:code` **sin** `JwtAuthGuard` y con `ThrottlerGuard` mas `@Throttle({ limit: 30, ttl: 5 * 60 * 1000 })`
- [x] 5.3 Verificar la firma del token antes de resolver el nio y devolver 404 generico si falla
- [x] 5.4 Consultar con `select` explicito: datos del nio, tutor principal (`isPrimary: true`) e informes `isDraft: false` con `title`, `periodStart`, `periodEnd`
- [x] 5.5 Calcular `age` en el backend a partir de `dateOfBirth`
- [x] 5.6 Filtrar por `isActive: true` y devolver 404 para nios inactivos
- [x] 5.7 Definir el tipo de respuesta como DTO dedicado en `public/dto/` que no exponga `diagnostico` ni `content` de informes
- [x] 5.8 Agregar pruebas unitarias: token valido, token invalido, nio inactivo, limite de peticiones, ausencia de campos sensibles en la respuesta

## 6. Endpoint de escaneo de asistencia (backend)

- [x] 6.1 Crear el modulo `backend/src/attendance/` con controller, service y DTO
- [x] 6.2 Implementar `POST /attendance/scan` con `JwtAuthGuard` y `RolesGuard`
- [x] 6.3 Aceptar en el DTO `code` y normalizarlo: si llega una URL, extraer el ultimo segmento de la ruta
- [x] 6.4 Verificar la firma y resolver el nio activo, devolviendo 404 en cualquier fallo
- [x] 6.5 Registrar con `upsert` sobre `@@unique([childId, date])` usando `create` con `PRESENTE` y `update: {}`, para que el reescaneo sea idempotente
- [x] 6.6 Responder 201 en el primer registro y 200 cuando ya existia la asistencia del dia
- [x] 6.7 Restringir a ADMIN y PERSONAL_ADMINISTRATIVO, y a ESPECIALISTA solo sobre ninos asignados (reutilizar el filtro por `specialistId` de `ChildrenService.findAll`)
- [x] 6.8 Asignar `registeredById` al usuario autenticado que escanea
- [x] 6.9 Agregar pruebas unitarias: escaneo valido, reescaneo el mismo dia, token manipulado, sin JWT, especialista sobre nio no asignado, nio inactivo

## 7. Tipos y cliente HTTP (frontend)

- [x] 7.1 Agregar `carnet` y `credentialCode` a `fronted/src/types/child.ts`
- [x] 7.2 Crear el tipo `PublicChildProfile` en un archivo separado, mirroring el DTO publico
- [x] 7.3 Crear `fronted/src/lib/api/public-child.ts` con el cliente del endpoint publico usando la instancia de axios sin interceptor de token
- [x] 7.4 Crear `fronted/src/lib/api/attendance.ts` con `scanAttendance(code)`

## 8. `carnet` en el formulario de nios (frontend)

- [x] 8.1 Agregar el campo `carnet` al `childSchema` de `child-form.tsx` con mensaje de obligatoriedad
- [x] 8.2 Agregar el campo `carnet` al `childSchema` del nio, con input de texto y `maxLength`, distinto del `carnet` del tutor
- [x] 8.3 Mostrar el carnet en la vista de edicion precargado y editable
- [x] 8.4 Renderizar el error de carnet duplicado DEVUELTO por el backend (400) junto al campo, no solo como toast

## 9. Pagina publica para padres (frontend)

- [x] 9.1 Crear `fronted/src/app/(public)/publico/nino/[code]/page.tsx` como server component que consulta el endpoint publico
- [x] 9.2 Crear `fronted/src/app/(public)/layout.tsx` sin `ProtectedRoute`, con layout minimo sin sidebar
- [x] 9.3 Renderizar nombre completo, edad, foto, y los datos del tutor principal (telefono, direccion)
- [x] 9.4 Renderizar el listado de informes con titulo y periodo
- [x] 9.5 Manejar el estado 404 con un mensaje de credencial no valida, sin mostrar error tecnico ni stack
- [x] 9.6 Omitir la seccion del tutor principal cuando el nio no tenga tutor marcado como principal
- [ ] 9.7 Verificar que la ruta es accesible sin sesion y que el dashboard sigue protegido (verificacion manual)

## 10. Credencial imprimible (frontend)

- [x] 10.1 Instalar `react-qr-code` y crear el componente `CredentialQr` que renderice el QR en SVG
- [x] 10.2 Crear `fronted/src/app/(dashboard)/children/[id]/credencial/page.tsx` con la tarjeta: foto, nombre, carnet, QR, datos del tutor principal
- [x] 10.3 Definir el CSS de impresion con `@page` y `print:` para que la credencial ocupe una sola pagina
- [x] 10.4 Enlazar a la credencial desde la seccion de datos del nio en el detalle
- [x] 10.5 Marcar visualmente los carnets `LEGACY-*` como pendientes de reemplazo
- [x] 10.6 Mostrar el carnet del nio en el detalle y en el listado de nios
- [ ] 10.7 Verificar la impresion en Chrome y en Firefox, y el guardado como PDF desde el navegador (verificacion manual)

## 11. Vista de asistencia por QR (frontend)

- [x] 11.1 Crear `fronted/src/app/(dashboard)/attendance/page.tsx` con la interfaz de escaneo
- [x] 11.2 Montar `html5-qrcode` en un componente cliente, con `useEffect` y limpieza de `getTracks()` al desmontar
- [x] 11.3 Llamar a `scanAttendance` con el valor decodificado y mostrar el nombre del nio y el estado del registro
- [x] 11.4 Agregar un campo de entrada manual del `credentialCode` siempre visible como alternativa a la camara
- [x] 11.5 Manejar camara no soportada o permiso denegado mostrando solo la entrada manual, sin romper la vista
- [x] 11.6 Mostrar mensaje de credencial no valida ante un QR no reconocido y permitir reintentar
- [x] 11.7 Agregar el enlace a la vista de asistencia en el sidebar del dashboard (ya existia como Asistencias)

## 12. Verificacion

- [x] 12.1 `npx tsc --noEmit` limpio en backend y frontend
- [x] 12.2 `npm run lint` limpio en backend y frontend
- [x] 12.3 `npm run build` limpio en el backend
- [x] 12.4 Pruebas unitarias de token, endpoint publico y escaneo en verde
- [ ] 12.5 Verificacion manual: registrar nio con carnet duplicado devuelve 400 y el error aparece en el campo del formulario
- [ ] 12.6 Verificacion manual: imprimir la credencial y escanear el QR con el telefono abre la pagina publica
- [ ] 12.7 Verificacion manual: escanear la misma credencial dos veces el mismo dia no duplica la asistencia
- [ ] 12.8 Verificacion manual: la pagina publica no expone diagnostico ni contenido de informes
- [ ] 12.9 Verificacion manual: un token manipulado devuelve 404 tanto en la pagina publica como en el escaneo
