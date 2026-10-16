## ADDED Requirements

### Requirement: Realtime Emission Service

El sistema SHALL exponer un `RealtimeService` global e inyectable por los
módulos de dominio, que encapsule la emisión de eventos (`sendNotification`,
`broadcastToAdmins`, `emitToRooms`) sin acoplarlos al gateway.

#### Scenario: Emisión desde un módulo de dominio
- **WHEN** un servicio de dominio (asistencia, actividad, informe, pago,
  inscripción) necesita notificar un cambio
- **THEN** inyecta `RealtimeService` y emite el evento correspondiente a las
  rooms relevantes sin conocer los detalles de Socket.io

#### Scenario: Gateway no inicializado
- **WHEN** un servicio emite un evento antes de que el gateway tenga servidor
- **THEN** la emisión se ignora de forma segura sin lanzar errores

### Requirement: In-memory Notification Store

El frontend SHALL mantener las notificaciones en un store en memoria de la
sesión (sin persistencia en base de datos), con contador de no leídas y acciones
para marcar como leída o marcar todas.

#### Scenario: Notificación recibida
- **WHEN** el cliente recibe `notification`
- **THEN** se agrega al store como no leída, se incrementa el contador y se
  muestra un toast

#### Scenario: Marcar como leídas
- **WHEN** el usuario abre el centro de notificaciones y marca una o todas
- **THEN** el contador se actualiza en consecuencia sin recargar la página
