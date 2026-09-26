## MODIFIED Requirements

### Requirement: Child Registration

El sistema SHALL permitir registrar un nio con sus datos personales y los datos de su padre/madre/tutor embebidos en el mismo registro (no como usuario del sistema).

Datos del nio:

- `name`, `lastName`, `dateOfBirth`, `sex`, `photoUrl`, `diagnostico`, `isActive`
- `carnet` — documento de identidad del nio, **obligatorio** y **unico** en el sistema. El sistema SHALL rechazarlo con 400 si falta, si viene en blanco o si ya pertenece a otro nio.

El sistema SHALL generar automaticamente el `credentialCode` del nio al crearlo; el cliente no lo envia ni lo modifica.

Datos del tutor (embebidos en `Child`):

- `parentName`, `parentLastName`, `parentRelationship` (Madre/Padre/Tutor...), `parentPhone`, `parentEmail` (opcional), `parentCarnet` (documento de identidad), `parentAddress` (opcional)

#### Scenario: Registro exitoso
- **WHEN** un usuario con permiso registra un nio con sus datos, su `carnet` y los del tutor
- **THEN** el sistema crea el registro con los campos embebidos del tutor, persiste el `carnet`, genera un `credentialCode` unico y devuelve 201 con el nio creado

#### Scenario: El tutor no es un usuario
- **WHEN** se registra un nio con datos de tutor
- **THEN** no se crea ninguna cuenta `User` para el tutor y `parentCarnet` se guarda como dato del nio

#### Scenario: carnet ausente
- **WHEN** se registra un nio sin `carnet` o con `carnet` en blanco
- **THEN** el sistema rechaza el registro con 400 y un mensaje de validacion

#### Scenario: carnet duplicado
- **WHEN** se registra o actualiza un nio con un `carnet` que ya pertenece a otro nio
- **THEN** el sistema rechaza la operacion con 400 indicando que el carnet ya esta en uso

#### Scenario: Actualizacion que conserva el carnet
- **WHEN** se actualiza un nio reenviando su propio `carnet` sin cambios
- **THEN** el sistema acepta la operacion y no lo trata como duplicado
