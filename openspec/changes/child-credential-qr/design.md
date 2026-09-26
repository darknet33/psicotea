## Context

`Child` no tiene identidad propia: se identifica por nombre, y el unico identificador (`id`) es un autoincremento interno que nunca ve el padre. La foto se cargo en el change anterior como `photoUrl`, pero no hay ningun documento que el padre pueda mostrar ni ningun mecanismo de verificacion de que el nio presente es quien dice ser.

`Attendance` ya existe en el modelo con `@@unique([childId, date])` y `registeredById`, pero no hay modulo de asistencia en el backend todavia (los modulos actuales son `auth`, `children`, `enrollments`, `payments`, `users`, `uploads`). El control de asistencia se hace hoy fuera del sistema.

Restricciones del proyecto:
- NestJS 10 con `@nestjs/throttler` ya instalado y usado por patron en `auth.controller.ts` (`@UseGuards(ThrottlerGuard)` + `@Throttle`).
- Los guards se aplican **por controlador** (`@UseGuards(JwtAuthGuard, RolesGuard)`), no hay guard global. Un controlador sin guard es publico por construccion.
- El frontend es Next.js 16 con route groups. La autenticacion se aplica client-side via `ProtectedRoute` dentro del layout de `(dashboard)`. **No hay `middleware.ts`**, asi que cualquier ruta fuera de `(dashboard)` es publica sin tocar configuracion.
- `FRONTEND_URL` ya existe en el `.env` del backend.
- Los fathers/parents no son usuarios del sistema (`Tutor` es un entidad embebida, no una cuenta `User`).

## Goals / Non-Goals

**Goals:**
- Dar al nio un identificador propio (`carnet`) obligatorio y unico, visible en el sistema.
- Emitir una credencial imprimible con foto, datos, carnet y QR.
- Un token de credencial que no se pueda adivinar ni alterar, reutilizable para consulta publica y para asistencia.
- Una pagina publica acotada que el padre pueda consultar sin sesion.
- Registro de asistencia por escaneo, restringido a usuarios del sistema e idempotente por dia.

**Non-Goals:**
- No se expone contenido clinico: ni `diagnostico`, ni el `content` de los informes, ni pagos.
- No se genera un PDF en el backend. La credencial es una pagina HTML; el PDF sale del dialogo de impresion del navegador.
- No se implementa revocacion ni caducidad de credenciales. El token es estable mientras el nio exista.
- No se construye un panel de historial de asistencia mas alla de registrar la presencia.
- No se migran carnets de `Tutor` al nuevo esquema; `Tutor.carnet` sigue siendo independiente.

## Decisions

### 1. Token de credencial: `<randomId>.<firma>`

`credentialCode` se genera en el backend como 32 hex aleatorios (`randomBytes(16).toString('hex')`) seguidos de `.` y un HMAC-SHA256 truncado del `randomId` con `CREDENTIAL_SECRET`. Se compara con `timingSafeEqual`.

- **Alternativa descartada — `cuid()` o `uuid()` sin firma**: cumple "no adivinable" pero no "firmado". El usuario pidio explicitamente un token firmado, y la firma tambien protege contra que alguien con escritura parcial en la base de datos alinee el `credentialCode` de un nio con el de otro.
- **Alternativa descartada — JWT auto-contenido**: obliga a decidir expiracion (una credencial de nino no deberia expirar) y produce un token largo que no entra comodo en un QR de tarjeta.
- El componente aleatorio da 128 bits de entropia (no atacable por fuerza bruta); la firma da verificacion de integridad. Son propiedades complementarias, no redundantes.

`CREDENTIAL_SECRET` es una variable de entorno nueva, distinta de `JWT_SECRET`. Mezclarlas impediria rotar una sin la otra.

### 2. Un solo QR, dos consumidores

El QR de la credencial codifica la URL absoluta del frontend: `{FRONTEND_URL}/publico/nino/{credentialCode}`. `POST /attendance/scan` acepta **tanto** el codigo suelto **como** esa URL completa, de la que extrae el ultimo segmento de la ruta.

- **Alternativa descartada — dos QRs en la tarjeta** (uno publico, otro de asistencia): duplica el espacio en una credencial pequena, y obliga a reimprimir la tarjeta si se decide cambiar el esquema. Ademas, el segundo QR expondría un token de asistencia en un documento que circula entre padres.
- Que el token de asistencia sea el mismo que el publico es aceptable porque el endpoint de asistencia exige JWT: sin sesion, conocer el token no basta.

### 3. Modulo `public` separado, con DTO por lista blanca

Nuevo modulo `public` en el backend cuyo controlador **no** aplica `JwtAuthGuard`. Resuelve el nio por `credentialCode`, filtra por `isActive: true`, y proyecta explicitamente los campos del DTO publico (`name`, `lastName`, `age`, `photoUrl`, `primaryTutor{name,lastName,relationship,phone,address}`, `reports[{title,periodStart,periodEnd}]` con `isDraft: false`).

- **Alternativa descartada — reutilizar `GET /children/:id` con un token**: acopla la superficie publica al modelo interno. Un campo nuevo agregado a `Child` se filtraria a la pagina publica sin que nadie lo note.
- El DTO se construye con `select` en la consulta de Prisma, no con `delete` sobre un objeto plano: un campo no seleccionado no llega a existir en memoria, asi que no puede filtrarse por accidente.

`age` se calcula en el backend a partir de `dateOfBirth` para que el cliente no pueda mostrar una edad inconsistente con la fecha real.

Los errores de token invalido e hijo inexistente devuelven **el mismo** 404 generico, para no confirmar la existencia de un nio.

### 4. Limitacion de tasa en el controlador publico

Se aplica el mismo patron ya usado en `auth.controller.ts`: `@UseGuards(ThrottlerGuard)` mas un `@Throttle` mas estricto que el default (por ejemplo 30 peticiones / 5 minutos). `@nestjs/throttler` ya esta instalado, no agrega dependencias.

### 5. La ruta publica vive fuera de `(dashboard)`

`src/app/(public)/publico/nino/[code]/page.tsx`. Como la autenticacion se aplica unicamente dentro del layout de `(dashboard)`, esta ruta es publica sin modificacion de `middleware` ni de `next.config`. La credencial imprimible vive en `(dashboard)/children/[id]/credencial` porque si requiere sesion.

### 6. Generacion del QR: `react-qr-code`

Componente React que emite **SVG puro**, sin canvas, compatible con SSR y con React 19 (peer dependency `*`). Se usa dentro de un componente cliente.

- **Alternativa descartada — `qrcode`**: necesita canvas y no es componente React.
- **Alternativa descartada — generarlo en el backend y servirlo como imagen**: obliga a una peticion extra y a cachear imagenes que cambian si cambia la URL base.

### 7. Lectura del QR: `html5-qrcode` con entrada manual

`html5-qrcode` maneja la camara via `getUserMedia` y no tiene peer dependency de React. La vista de asistencia **siempre** ofrece un campo de entrada manual ademas del lector, porque la API nativa `BarcodeDetector` no existe en iOS Safari y el permiso de camara puede ser denegado.

### 8. Asistencia idempotente por nio y fecha

`Attendance` ya tiene `@@unique([childId, date])`. El servicio hace `upsert` por esa clave compuesta con `create: { status: PRESENTE, registeredById }` y `update: {}`. Un segundo escaneo el mismo dia actualiza la fila existente en lugar de duplicar, y responde 200 en vez de 201. Esto evita tener que capturar y reintentar la excepcion `P2002`.

Un ESPECIALISTA solo puede escanear ninos asignados a el, reutilizando el filtro por `specialistId` que ya usa `ChildrenService.findAll`.

### 9. `carnet` obligatorio con backfill en la migracion

`Child.carnet String @unique` se agrega como NOT NULL. La migracion rellena las filas existentes con `LEGACY-<id>` para que el deploy no falle por filas sin valor. Es un marcador visible: el personal debe reemplazarlo, y la UI muestra esos valores de forma distinguible para que no se pasen inadvertidos.

- **Alternativa descartada — `carnet` opcional**: dejariaCredentiales sin identificador, que es justo lo que este change resuelve.

## Risks / Trade-offs

- **La ruta publica expone datos personales de nios** → DTO por lista blanca construido con `select` de Prisma, filtro `isActive: true`, 404 generico indistinguible del token invalido, y limitacion de tasa. Aun asi, cualquier persona con la credencial fisica ve nombre, edad, foto y contacto del tutor: es el compromiso explicito de este diseno.
- **Los carnets `LEGACY-*` quedan como marcadores** → se muestran diferenciados en la UI (credencial y listado) para inducir la carga del carnet real antes de imprimir credenciales definitivas.
- **La API de `POST /children` cambia de forma incompatible** (nuevo campo obligatorio) → los clientes consumidores (seed, scripts, Postman) se actualizan en el mismo change. Es el unico breaking change y esta declarado como tal en el proposal.
- **`html5-qrcode` no existe enSSR** → el lector se monta solo en un componente cliente con `useEffect`, y se desmonta limpiando `getTracks()` para no dejar la camara encendida al navegar.
- **El token no se puede revocar** → si una credencial se reimprime con datos equivocados, la unica salida es regenerar `credentialCode` de forma manual en la base de datos o marcando al nio como inactivo. Aceptable para un identificador que no concede acceso al sistema.
- **Los titulos de informe visibles publicamente podrian ser sensibles por si mismos** → hoy se expone solo `title` y `periodStart/End`; la exposicion del contenido esta planteada como pregunta abierta.
- **`ThrottlerGuard` depende de la IP** → detras de un proxy el limite se aplica al proxy, no al cliente. Ajustar `trust proxy` si el despliegue lo requiere.

## Migration Plan

1. Agregar `CREDENTIAL_SECRET` a `.env` y a `.env.example` del backend.
2. Migracion Prisma: agregar `Child.carnet String @unique` y `Child.credentialCode String? @unique`; backfill de `carnet` con `LEGACY-<id>`.
3. Desplegar backend con el DTO de `carnet` ya obligatorio.
4. Script de backfill: generar `credentialCode` firmado para cada nio que aun no lo tenga, y volver el campo NOT NULL.
5. Actualizar el seed con carnets y `credentialCode` generado.
6. Desplegar frontend: campo `carnet` en el formulario, credencial, ruta publica y asistencia.

**Rollback**: revertir la migracion elimina ambas columnas. Los nios quedan sin carnet, que es el estado previo al change. No hay transformacion de datos destructiva: el unico dato generado son los tokens y los marcadores `LEGACY-*`, ambos reconstruibles.

## Open Questions

- **Exposicion de informes**: la pagina publica muestra hoy `title` y periodo. Hay que confirmar si mas adelante se expone tambien el `content`, el `pdfUrl`, o solo un enlace a descargar. Es la decision con mayor implicacion de privacidad pendiente.
- **Historial de asistencia publico**: el padre podria ver fechas de presencia/ausencia. No esta expuesto; falta confirmar si se quiere.
- **Convencion de `carnet`**: no se define formato (longitud, prefijo, solo digitos). Si se requiere, conviene fijarlo antes de imprimir credenciales definitivas.
- **Qr regenerable**: confirmar si el usuario necesitara una accion de "regenerar credencial" cuando cambia la foto o el carnet.
