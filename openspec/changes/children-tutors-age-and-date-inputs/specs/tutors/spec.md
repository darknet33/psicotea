## ADDED Requirements

### Requirement: Tutor Entity

El sistema SHALL gestionar una entidad `Tutor` con `name`, `lastName`, `phone` (Celular/WhatsApp), `email` (opcional) y `carnet` (documento de identidad). Un tutor SHALL ser reutilizable por varios niños y NO SHALL generarse como usuario del sistema (no tiene login). El carnet SHALL ser único para deduplicación.

#### Scenario: Tutor no es usuario
- **WHEN** se registra un tutor
- **THEN** se crea una entidad `Tutor` sin cuenta de `User` (no puede iniciar sesión)

#### Scenario: Carnet duplicado reutiliza el tutor
- **WHEN** dos niños referencian un tutor con el mismo `carnet`
- **THEN** el sistema no duplica el tutor: reuse el mismo registro de `Tutor` y crea un nuevo vínculo

### Requirement: Child-Tutor Many-to-Many

El sistema SHALL permitir que un niño tenga muchos tutores y que un tutor esté vinculado a varios niños, mediante una relación N:N. Cada vínculo niño-tutor SHALL registrar el `relationship` (parentesco, ej. Madre/Padre/Tutor) y si es tutor principal (`isPrimary`).

#### Scenario: Niño con varios tutores
- **WHEN** se registra o edita un niño con más de un tutor
- **THEN** todos los tutores quedan vinculados al niño con su parentesco respectivo

#### Scenario: Tutor vinculado a varios niños
- **WHEN** un tutor ya existente (mismo `carnet`) se vincula a un segundo niño
- **THEN** el vínculo N:N permite que el mismo tutor aparezca en ambos niños sin duplicarse

#### Scenario: Lectura en expediente
- **WHEN** se consulta `GET /children/:id`
- **THEN** la respuesta incluye todos los tutores del niño con `relationship`, `isPrimary` y los datos del tutor

### Requirement: Primary Tutor

El sistema SHALL requerir exactamente un tutor principal (`isPrimary = true`) por niño. El tutor principal SHALL usarse como tutor de referencia en el listado de niños y en pantallas que muestren un único tutor/responsable.

#### Scenario: Un solo principal
- **WHEN** se envía un niño con `isPrimary: true` en exactamente un tutor
- **THEN** el sistema acepta el registro y asigna ese tutor como principal

#### Scenario: Sin tutor principal
- **WHEN** se envía un niño sin ningún tutor marcado como principal
- **THEN** el sistema rechaza con error de validación (400)

#### Scenario: Más de un principal
- **WHEN** se envía un niño con más de un tutor marcado como principal
- **THEN** el sistema rechaza con error de validación (400)

#### Scenario: Tutor principal en el listado
- **WHEN** se lista `GET /children`
- **THEN** el tutor principal se identifica en la respuesta para mostrarse como responsable