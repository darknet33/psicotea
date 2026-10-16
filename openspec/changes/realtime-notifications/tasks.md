## 1. Backend

- [x] 1.1 Instalar `@nestjs/websockets`, `@nestjs/platform-socket.io` y `socket.io`.
- [x] 1.2 `backend/src/realtime/events.gateway.ts`: validación de JWT en
      `handleConnection`, rooms por rol/usuario, `handleDisconnect`,
      `sendNotification`, `broadcastToAdmins`, `emitToRooms`.
- [x] 1.3 `RealtimeService` (wrapper tipado) y `RealtimeModule` marcado `@Global()`.
- [x] 1.4 Registrar `RealtimeModule` en `app.module.ts`.
- [x] 1.5 Emitir eventos de dominio desde `attendance`, `activities`, `reports`,
      `payments` y `enrollments`.
- [x] 1.6 Tests unitarios del service/gateway con `server` simulado.

## 2. Frontend

- [x] 2.1 Instalar `socket.io-client`.
- [x] 2.2 `lib/socket.ts` (`socket`, `connectSocket`, `disconnectSocket`, `socketUrl`).
- [x] 2.3 `hooks/use-socket.ts` (suscripción con limpieza de listeners).
- [x] 2.4 `stores/notification-store.ts` (store en memoria: add, markAsRead,
      markAllAsRead, unreadCount).
- [x] 2.5 `components/layout/notification-center.tsx` (campana + contador + dropdown).
- [x] 2.6 Integrar en `header.tsx`; conectar socket y toasts desde la capa de
      cliente autenticada.

## 3. Verificación

- [x] 3.1 `backend`: `npm run build`, `npm run lint`, `npm test`.
- [x] 3.2 `fronted`: `npm run lint`, `npm run build`.
- [x] 3.3 `openspec validate --changes --strict`.
