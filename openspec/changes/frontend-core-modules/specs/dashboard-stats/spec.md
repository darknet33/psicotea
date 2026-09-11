## ADDED Requirements

### Requirement: Dashboard Real Stats

El dashboard (`/dashboard`) SHALL mostrar valores reales en sus tarjetas de resumen: "Ninos activos" (via `GET /children?isActive=true`), "Inscripciones" (via `GET /enrollments`) y "Pagos registrados" (via `GET /payments`, acumulado del mes o total). La tarjeta de "Asistencias de hoy" SHALL permanecer con valor estatico hasta que exista el modulo Attendance (Fase 6).

#### Scenario: Valores reales
- **WHEN** el dashboard carga
- **THEN** las tarjetas muestran los conteos obtenidos de la API (con formato moneda en pagos)

#### Scenario: Error de la API
- **WHEN** una o mas consultas fallan
- **THEN** la tarjeta afectada muestra un valor degradado y el dashboard notifica el error sin romper la pagina

#### Scenario: Carga
- **WHEN** los datos estan cargando
- **THEN** las tarjetas muestran un estado de carga (skeleton)