## MODIFIED Requirements

### Requirement: Child Registration

El sistema SHALL permitir registrar un niño con sus datos personales, una foto, un diagnóstico y sus tutores/responsables embebidos en el mismo registro (no como usuario del sistema).

Datos del niño:

- `name`, `lastName`, `dateOfBirth`, `sex`, `photoUrl` (obligatorio — ruta `/uploads/...` devuelta por el servicio de subida, o URL absoluta), `diagnostico` (obligatorio), `isActive`

La fecha de inscripción ya no forma parte del niño: `enrollmentDate` SHALL ser eliminado y la inscripción se registra únicamente vía el módulo de `enrollments` (`startDate`).

Datos de cada tutor:

- `name`, `lastName`, `relationship` (Madre/Padre/Tutor...), `phone`, `email` (opcional), `address` (dirección, opcional), `carnet` (documento de identidad), `isPrimary` (exactamente un principal)

#### Scenario: Registro exitoso
- **WHEN** un usuario con permiso registra un niño con foto (URL), diagnóstico, datos personales y tutores
- **THEN** el sistema crea el registro y devuelve 201 con el niño creado

#### Scenario: Foto obligatoria
- **WHEN** se intenta registrar o actualizar un niño sin `photoUrl` o con un valor que no es una ruta `/uploads/...` ni una URL absoluta
- **THEN** el sistema devuelve 400 con un error de validación

#### Scenario: Diagnóstico obligatorio
- **WHEN** se intenta registrar o actualizar un niño sin `diagnostico`
- **THEN** el sistema devuelve 400 con un error de validación

#### Scenario: Sin fecha de inscripción en el niño
- **WHEN** se registra un niño enviando `enrollmentDate`
- **THEN** el campo se ignora o rechaza (400) y la fecha de inscripción solo se asocia a un `Enrollment`

#### Scenario: El tutor no es un usuario
- **WHEN** se registra un niño con datos de tutor
- **THEN** no se crea ninguna cuenta `User` para el tutor y el `carnet` se reutiliza al vincular otro niño

#### Scenario: Tutor con dirección
- **WHEN** se registra o actualiza un niño con el campo `address` de un tutor
- **THEN** la dirección se guarda en el tutor y se devuelve en el detalle del niño

## ADDED Requirements

### Requirement: Photo Input Control

El formulario de registro/edición de un niño SHALL permitir generar la foto mediante drag & drop, selección de archivo y cámara del dispositivo. El control debe subir la imagen al backend a través del endpoint de `photo-upload`, mostrar la URL obtenida como valor del campo `photoUrl` y previsualizar la imagen antes y después de subir.

#### Scenario: Arrastrar y soltar imagen
- **WHEN** el usuario arrastra una imagen válida a la zona de drop
- **THEN** se muestra la previsualización y, al persistir el formulario, el niño queda con la fotografía

#### Scenario: Captura con cámara
- **WHEN** el usuario elige la opción de cámara y captura la foto
- **THEN** la imagen capturada se previsualiza y queda lista como `photoUrl` al guardar

#### Scenario: Archivo inválido
- **WHEN** el usuario suelta o selecciona un archivo que no es imagen o excede el tamaño permitido
- **THEN** el control muestra un error y no se modifica la `photoUrl`

### Requirement: Tutor Address

Cada tutor vinculado a un niño SHALL poder incluir una dirección (`address`) opcional, utilizada como dato de contacto del expediente.

#### Scenario: Dirección opcional
- **WHEN** se registra un tutor sin dirección
- **THEN** el tutor se guarda correctamente con `address` nulo

#### Scenario: Dirección en CRUD
- **WHEN** un usuario consulta o actualiza un niño
- **THEN** la respuesta incluye la `address` de cada tutor