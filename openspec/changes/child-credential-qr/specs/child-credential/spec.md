## ADDED Requirements

### Requirement: Child Identity Credential

El sistema SHALL emitir una credencial digital por nino, identificada por un token opaco firmado, y SHALL permitir renderizarla como pagina HTML optimizada para impresion con la foto, los datos del nino y un codigo QR.

El token `credentialCode` SHALL tener la forma `<randomId>.<signature>`, donde `randomId` son 32 caracteres hexadecimales generados de forma criptograficamente aleatoria y `signature` es el HMAC-SHA256 truncado de `randomId` calculado con `CREDENTIAL_SECRET`. El sistema SHALL verificar la firma antes de resolver el nino.

La credencial SHALL codificar en su QR la URL absoluta `{FRONTEND_URL}/publico/nino/{credentialCode}`.

#### Scenario: Credencial de un nino
- **WHEN** un usuario autorizado abre la credencial de un nino
- **THEN** el sistema muestra foto, nombre completo, carnet, datos del tutor principal y un QR que decodifica a la URL publica de ese nino

#### Scenario: Firma invalida
- **WHEN** se solicita la credencial con un `credentialCode` cuya firma no corresponde a `CREDENTIAL_SECRET`
- **THEN** el sistema devuelve 404 y no resuelve ningun nino

#### Scenario: Vista imprimible
- **WHEN** el usuario imprime la credencial o la guarda como PDF desde el navegador
- **THEN** el resultado ocupa una sola pagina con la tarjeta, la foto y el QR legibles

### Requirement: Credential Token Uniqueness

El sistema SHALL garantizar que cada nino tenga un unico `credentialCode` y que el sistema lo genere automaticamente al crear al nino, sin depender del valor enviado por el cliente.

#### Scenario: Generacion automatica
- **WHEN** se crea un nino sin especificar `credentialCode`
- **THEN** el sistema genera un token unico y lo persiste junto al nino

#### Scenario: Ninos distintos con tokens distintos
- **WHEN** se consultan las credenciales de dos ninos distintos
- **THEN** ambos `credentialCode` son diferentes y cada uno resuelve a su propio nino
