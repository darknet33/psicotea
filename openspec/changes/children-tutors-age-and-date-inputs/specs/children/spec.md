## MODIFIED Requirements

### Requirement: Child Registration

El sistema SHALL permitir registrar un niño con sus datos personales y uno o más tutores relacionados (N:N, ver capability `tutors`), con al menos un tutor principal. Los tutores no se crean como usuarios del sistema.

Datos del niño:

- `name`, `lastName`, `dateOfBirth`, `sex` (`Varón | Mujer`), `photo` (opcional), `enrollmentDate`, `isActive`

Datos de cada tutor (vía relación `ChildTutor`):

- `name`, `lastName`, `relationship` (Madre/Padre/Tutor...), `phone` (Celular/WhatsApp), `email` (opcional), `carnet` (documento de identidad), `isPrimary` (exactamente un tutor principal por niño)

#### Scenario: Registro exitoso
- **WHEN** un usuario con permiso registra un niño con sus datos y al menos un tutor (uno marcado como principal)
- **THEN** el sistema crea el registro, vincula los tutores (relación N:N) y devuelve 201 con el niño creado

#### Scenario: El tutor no es un usuario
- **WHEN** se registra un niño con datos de tutor
- **THEN** se crea/vincula la entidad `Tutor` (con su `carnet`) sin generar ninguna cuenta `User` para el tutor

#### Scenario: Sexo válido
- **WHEN** se envía `sex` con valor `Varón` o `Mujer`
- **THEN** el sistema acepta el registro

#### Scenario: Sexo inválido
- **WHEN** se envía `sex` con un valor distinto de `Varón` o `Mujer` (p. ej. `M`, `F`, `Masculino`, `Femenino`)
- **THEN** el sistema rechaza con error de validación (400)

## ADDED Requirements

### Requirement: Child Age Display

El sistema SHALL mostrar la edad del niño calculada a partir de `dateOfBirth` en el listado de niños (`GET /children`) y en el expediente (`GET /children/:id`), en formato años y meses completos (ej. "6 años 3 meses"). Para menores de un año, SHALL mostrarse solo en meses (ej. "8 meses").

#### Scenario: Edad en el listado
- **WHEN** se muestra el listado de niños
- **THEN** cada fila incluye la edad calculada a la fecha actual, junto a la fecha de nacimiento

#### Scenario: Edad en el expediente
- **WHEN** se abre el expediente de un niño
- **THEN** la sección de datos del niño muestra la edad calculada

#### Scenario: Menores de un año
- **WHEN** la fecha de nacimiento es menor a un año desde hoy
- **THEN** la edad se muestra solo en meses (ej. "8 meses")