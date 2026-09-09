# Realtime Communication Specification

## Overview

Sistema de comunicación en tiempo real mediante WebSocket para notificaciones y actualizaciones en la plataforma Sistema_PsicoTea.

## Requirements

### REQ-WS-001: WebSocket Gateway

- **Technology**: Socket.io via NestJS @WebSocketGateway
- **Port**: Mismo que el API REST (configurable via variable de entorno)
- **Namespace**: / (default)
- **Authentication**: JWT token en handshake

### REQ-WS-002: Connection Flow

```
1. Client se conecta con JWT token:
   socket.io('http://localhost:3001', {
     auth: { token: 'Bearer <access_token>' }
   })

2. Server valida token en handleConnection:
   - Si válido: acepta conexión, une a room del usuario
   - Si inválido: rechaza conexión

3. Client se une a rooms según su rol:
   - Admin: room 'admin', room 'all'
   - Especialista: room 'especialista', room 'user:{id}'
   - Personal: room 'personal', room 'user:{id}'
```

### REQ-WS-003: Event Types

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `connection` | Client→Server | - | Conexión establecida |
| `disconnect` | Client→Server | - | Desconexión |
| `notification` | Server→Client | { title, message, type, data } | Notificación general |
| `notification:personal` | Server→Client | { userId, ... } | Notificación personal |
| `attendance:update` | Server→Client | { childId, date, status } | Actualización de asistencia |
| `activity:new` | Server→Client | { childId, activity } | Nueva actividad registrada |
| `report:new` | Server→Client | { childId, report } | Nuevo informe de avance |
| `payment:new` | Server→Client | { childId, payment } | Nuevo pago registrado |
| `enrollment:update` | Server→Client | { childId, enrollment } | Cambio en inscripción |

### REQ-WS-004: Notification System

**Tipos de notificación**:
- `info`: Informativa (azul)
- `success`: Éxito (verde)
- `warning`: Advertencia (amarillo)
- `error`: Error (rojo)

**Ejemplo de notificación**:
```json
{
  "title": "Nuevo pago registrado",
  "message": "Se registró un pago de $500 para Juan Pérez",
  "type": "success",
  "data": {
    "childId": 123,
    "paymentId": 456
  },
  "timestamp": "2026-09-09T15:00:00Z"
}
```

### REQ-WS-005: Backend Implementation

**EventsGateway**:
```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // Validate JWT token from handshake
    // Join user to appropriate rooms
  }

  handleDisconnect(client: Socket) {
    // Clean up user rooms
  }

  // Method to emit events
  sendNotification(userId: number, notification: NotificationDto) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  broadcastToAdmins(event: string, data: any) {
    this.server.to('admin').emit(event, data);
  }
}
```

### REQ-WS-006: Frontend Implementation

**Socket Configuration** (lib/socket.ts):
```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: getToken()
  }
});

export const connectSocket = () => {
  socket.auth.token = getToken();
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};
```

**useSocket Hook** (hooks/use-socket.ts):
```typescript
export function useSocket(event: string, callback: (data: any) => void) {
  useEffect(() => {
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
}
```

### REQ-WS-007: Notification UI

**Toast Notifications**:
- Usar Sonner o React Toastify para mostrar notificaciones
- Posición: top-right
- Auto-dismiss: 5 segundos (info), no auto-dismiss (error)
- Click para navegar a la acción relacionada

**Notification Center**:
- Icono de campana en el header con contador de no leídas
- Dropdown con lista de notificaciones recientes
- Marcar como leída individual o todas
- Enlace a "ver todas las notificaciones"

### REQ-WS-008: Real-time Updates

**Attendance Updates**:
- Cuando un especialista registra asistencia, se emite a:
  - Admin (room 'admin')
  - Personal administrativo (room 'personal')

**Activity Updates**:
- Cuando se registra una actividad, se emite a:
  - Admin
  - Especialistas asignados al niño
  - Personal administrativo

**Report Updates**:
- Cuando se crea un informe, se emite a:
  - Admin
  - Especialista creador
  - Personal administrativo (si tiene permiso)

### REQ-WS-009: Error Handling

- **Connection Error**: Reconexión automática con exponential backoff
- **Authentication Error**: Redirigir a login
- **Server Error**: Mostrar toast de error, logging en consola
- **Network Offline**: Mostrar indicador de desconexión, pausar eventos

### REQ-WS-010: Performance

- **Room-based filtering**: Solo enviar eventos a usuarios relevantes
- **Throttling**: Limitar frecuencia de eventos de alta frecuencia (asistencias)
- **Compression**: Habilitar compresión de payloads
- **Memory**: Limpiar listeners de componentes desmontados

## Events Summary

| Event | Target | Trigger |
|-------|--------|---------|
| notification | User | Any notification |
| attendance:update | Admin, Personal | Attendance registered |
| activity:new | Admin, Personal, Assigned Specialists | Activity registered |
| report:new | Admin, Personal, Author | Report created |
| payment:new | Admin, Personal | Payment registered |
| enrollment:update | Admin, Personal | Enrollment status changed |
