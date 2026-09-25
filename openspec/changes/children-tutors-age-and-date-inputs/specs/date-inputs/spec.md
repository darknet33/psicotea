## ADDED Requirements

### Requirement: Desglose Día / Mes / Año

El ingreso de fechas en los formularios SHALL usar un selector desglosado en tres campos: Día, Mes y Año, en lugar de un contenedor de calendario nativo. El selector SHALL componer internamente el valor ISO `YYYY-MM-DD` que se envía a la API y SHALL resolver a una fecha válida.

#### Scenario: Composición de fecha
- **WHEN** el usuario selecciona día, mes y año
- **THEN** el formulario genera un valor `YYYY-MM-DD` válido y lo envía como `dateOfBirth`, `enrollmentDate`, `startDate` o `paymentDate` según el campo

#### Scenario: Días según mes y año
- **WHEN** el mes/año seleccionado tiene menos de 31 días (incluidos febrero en años bisiestos)
- **THEN** el selector limita los días disponibles al máximo válido y ajusta un día inválido ya seleccionado

#### Scenario: Estados vacíos
- **WHEN** aún no se ha seleccionado una fecha completa
- **THEN** el campo permanece vacío y la validación del formulario lo marca como obligatorio hasta completarlo

### Requirement: Aplicación de Fechas Actuales y Futuras

El selector Día/Mes/Año SHALL usarse en todos los formularios que capturen fechas: nacimiento e inscripción del niño, inicio de inscripción, fecha de pago. Todo campo de fecha introducido en el futuro SHALL seguir el mismo patrón para mantener consistencia.

#### Scenario: Formularios actuales
- **WHEN** se abren los formularios de niño, inscripción o pago
- **THEN** los campos de fecha se muestran como Día/Mes/Año desglosados

#### Scenario: Nuevos formularios
- **WHEN** se agrega un formulario nuevo con un campo de fecha
- **THEN** se reutiliza el selector Día/Mes/Año como estándar