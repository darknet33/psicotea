## ADDED Requirements

### Requirement: Public Child Lookup

El sistema SHALL exponer un endpoint publico sin autenticacion que, dado un `credentialCode` valido, devuelva un subconjunto acotado de datos del nino para consulta de los padres.

El DTO de respuesta SHALL incluir unicamente:

- `name`, `lastName`, `carnet`, `age` (en anos, derivado de `dateOfBirth`) y `photoUrl` del nino
- `primaryTutor` con `name`, `lastName`, `relationship`, `phone` y `address`
- `reports` con `title`, `periodStart` y `periodEnd` de los informes no borrador

El `carnet` del nino SHALL incluirse porque quien abre la pagina acaba de escanear la credencial que ya lo lleva impreso, de modo que no agrega exposicion y permite al padre confirmar que la credencial corresponde al nio correcto.

El DTO de respuesta SHALL excluir `diagnostico`, el contenido clinico de los informes, el `carnet` y el `email` del tutor, pagos, telefonos y direcciones de otros tutores.

El endpoint SHALL aplicar limitacion de tasa para impedir enumeracion por fuerza bruta del token.

#### Scenario: Consulta valida
- **WHEN** un padre abre la URL publica con un `credentialCode` valido
- **THEN** el sistema responde 200 con el nombre completo, el carnet, la edad, la foto, el telefono y la direccion del tutor principal, y el listado de informes por titulo y periodo

#### Scenario: Token invalido
- **WHEN** se solicita el endpoint con un `credentialCode` inexistente o con firma invalida
- **THEN** el sistema responde 404 con un mensaje generico que no revela si el nino existe

#### Scenario: Datos clinicos no expuestos
- **WHEN** un padre consulta la pagina publica de un nino
- **THEN** la respuesta no contiene el diagnostico ni el contenido de los informes

#### Scenario: Limite de peticiones
- **WHEN** un mismo origen supera el limite de peticiones al endpoint publico
- **THEN** el sistema responde 429 y el padre ve un mensaje de exceso de consultas

#### Scenario: Nino no activo
- **WHEN** se consulta la pagina publica de un nino con `isActive` en false
- **THEN** el sistema responde 404

### Requirement: Public Child Page

El frontend SHALL exponer una ruta publica `/publico/nino/[code]` accesible sin sesion iniciada, que consuma el endpoint publico y presente los datos del nino.

La ruta SHALL quedar excluida del middleware de autenticacion del frontend.

#### Scenario: Pagina sin sesion
- **WHEN** un padre abre `/publico/nino/{code}` sin haber iniciado sesion
- **THEN** la pagina se renderiza con los datos devueltos por el endpoint publico

#### Scenario: Code inexistente
- **WHEN** se abre `/publico/nino/{code}` con un token invalido
- **THEN** la pagina muestra un estado de credencial no valida, sin error tecnico

#### Scenario: Sin datos de tutor principal
- **WHEN** el nino no tiene tutor principal
- **THEN** la pagina omite la seccion del tutor principal en lugar de fallar
