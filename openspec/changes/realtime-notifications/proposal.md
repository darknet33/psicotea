## Why

La capability `realtime-communication` ya está especificada
(`openspec/specs/realtime-communication/spec.md`, proveniente de
`architecture-stack-definition`), pero **no está implementada**: el backend no
tiene gateway WebSocket ni `@nestjs/platform-socket.io`, el frontend no tiene
`socket.io-client` ni centro de notificaciones, y los módulos de dominio no
emiten eventos. El header ya muestra una campana sin funcionalidad.

## What Changes

- **Backend `RealtimeModule` global** con `EventsGateway`
  (`@WebSocketGateway`) que valida el JWT del handshake, une al usuario a sus
  rooms (`user:{id}`, `admin`, `especialista`, `personal`, `all`) y expone
  `sendNotification`, `broadcastToAdmins` y `emitToRooms`.
- **`RealtimeService`** inyectable por otros módulos para emitir eventos de
  dominio (`attendance:update`, `activity:new`, `report:new`, `payment:new`,
  `enrollment:update`) sin acoplarse al gateway.
- **Emisión desde los servicios existentes** (asistencia, actividades, informes,
  pagos, inscripciones).
- **Dependencias**: `@nestjs/websockets`, `@nestjs/platform-socket.io`,
  `socket.io` (backend) y `socket.io-client` (frontend).
- **Frontend**: `lib/socket.ts`, `hooks/use-socket.ts`, store de notificaciones
  en memoria y `components/layout/notification-center.tsx` integrado en el
  header con contador, dropdown y "marcar todas como leídas" + toasts (Sonner).
- **Sin persistencia**: las notificaciones viven en un store en memoria de la
  sesión (no hay tabla `Notification`); se documenta como decisión.

## Impact

- **Specs**: `ADDED` a `realtime-communication` (servicio de emisión y store en
  memoria).
- **Backend**: `backend/src/realtime/`, `app.ts`/`main.ts`, wiring en
  `attendance`, `activities`, `reports`, `payments`, `enrollments`.
- **Frontend**: header, layout de dashboard, store y hook de socket.
- **Sin cambios de base de datos** (notificaciones efímeras).
