# Realtime Communication Specification

## Purpose

Sistema de comunicación en tiempo real mediante WebSocket para notificaciones y actualizaciones en la plataforma Sistema_PsicoTea. Define el gateway Socket.io, flujo de conexión, tipos de eventos, sistema de notificaciones, implementación backend y frontend, UI de notificaciones, actualizaciones en tiempo real, manejo de errores y performance.

## Requirements

### Requirement: WebSocket Gateway

El sistema SHALL proveer comunicación en tiempo real mediante Socket.io vía `@WebSocketGateway` de NestJS, en el mismo puerto del API REST.

- **Technology**: Socket.io via NestJS @WebSocketGateway
- **Port**: Mismo que el API REST (configurable via variable de entorno)
- **Namespace**: / (default)
- **Authentication**: JWT token en handshake

#### Scenario: Conexión WebSocket
- **WHEN** un cliente se conecta al WebSocket
- **THEN** el gateway usa Socket.io en el namespace `/` sobre el puerto del API REST y valida el JWT del handshake

### Requirement: Connection Flow

El sistema SHALL validar el token JWT en el handshake, aceptando o rechazando la conexión, y uniendo al usuario a las rooms según su rol.

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

#### Scenario: Conexión con token válido
- **WHEN** un cliente se conecta con un JWT válido
- **THEN** el servidor acepta la conexión y une al usuario a las rooms según su rol

#### Scenario: Conexión con token inválido
- **WHEN** un cliente se conecta con un JWT inválido
- **THEN** el servidor rechaza la conexión

### Requirement: Event Types

El sistema SHALL soportar los eventos de conexión, desconexión, notificaciones y actualizaciones de dominio.

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

#### Scenario: Eventos definidos
- **WHEN** se emite o recibe información en tiempo real
- **THEN** se usan los eventos listados con sus direcciones y payloads

### Requirement: Notification System

El sistema SHALL clasificar las notificaciones en `info`, `success`, `warning` y `error`, con título, mensaje, tipo, datos y timestamp.

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

#### Scenario: Emisión de notificación
- **WHEN** el sistema emite una notificación
- **THEN** contiene `title`, `message`, `type` (uno de info/success/warning/error), `data` y `timestamp`

### Requirement: Backend Implementation

El backend SHALL implementar un `EventsGateway` que maneje conexión/desconexión, una a las rooms, envíe notificaciones por usuario y transmita eventos a admins.

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

#### Scenario: Gateway implementado
- **WHEN** se inspecciona el backend
- **THEN** existe `EventsGateway` con `handleConnection`, `handleDisconnect`, `sendNotification` y `broadcastToAdmins`

### Requirement: Frontend Implementation

El frontend SHALL configurar la conexión Socket.io en `lib/socket.ts` con auto-connect desactivado y ofrecer el hook `useSocket` para suscribirse a eventos.

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

#### Scenario: Conexión desde el frontend
- **WHEN** el frontend se conecta al WebSocket
- **THEN** usa `lib/socket.ts` para conectar/desconectar con el token y `useSocket` para suscribirse a eventos

### Requirement: Notification UI

El sistema SHALL mostrar notificaciones en tiempo real mediante toasts (Sonner o React Toastify) y un centro de notificaciones en el header.

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

#### Scenario: Toast al recibir evento
- **WHEN** el cliente recibe una notificación
- **THEN** se muestra un toast en top-right (auto-dismiss de 5 s para info, sin auto-dismiss para error) navegable al hacer click

#### Scenario: Centro de notificaciones
- **WHEN** un usuario abre el centro de notificaciones
- **THEN** ve el contador de no leídas, la lista reciente y puede marcar notificaciones como leídas

### Requirement: Real-time Updates

El sistema SHALL emitir actualizaciones en tiempo real para asistencias, actividades e informes a los usuarios relevantes.

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

#### Scenario: Actualización de asistencia
- **WHEN** un especialista registra asistencia
- **THEN** se emite `attendance:update` a admin y personal administrativo

#### Scenario: Nueva actividad o informe
- **WHEN** se registra una actividad o se crea un informe
- **THEN** se emiten `activity:new` / `report:new` a los usuarios relevantes según el destino

### Requirement: Error Handling

El sistema SHALL manejar errores de conexión, autenticación, servidor y red en el cliente WebSocket.

- **Connection Error**: Reconexión automática con exponential backoff
- **Authentication Error**: Redirigir a login
- **Server Error**: Mostrar toast de error, logging en consola
- **Network Offline**: Mostrar indicador de desconexión, pausar eventos

#### Scenario: Error de conexión
- **WHEN** la conexión WebSocket falla
- **THEN** el cliente intenta reconectar automáticamente con exponential backoff

#### Scenario: Error de autenticación
- **WHEN** la conexión es rechazada por token inválido o expirado
- **THEN** el sistema redirige al usuario a login

#### Scenario: Pérdida de red
- **WHEN** la red se desconecta
- **THEN** se muestra un indicador de desconexión y los eventos se pausan

### Requirement: Performance

El sistema SHALL optimizar el rendimiento con filtrado por rooms, throttling, compresión y limpieza de listeners.

- **Room-based filtering**: Solo enviar eventos a usuarios relevantes
- **Throttling**: Limitar frecuencia de eventos de alta frecuencia (asistencias)
- **Compression**: Habilitar compresión de payloads
- **Memory**: Limpiar listeners de componentes desmontados

#### Scenario: Filtrado por rooms
- **WHEN** se emite un evento
- **THEN** solo se envía a los usuarios de las rooms relevantes

#### Scenario: Limpieza de listeners
- **WHEN** un componente que usa `useSocket` se desmonta
- **THEN** el listener se remueve para evitar fugas de memoria

## Events Summary

| Event | Target | Trigger |
|-------|--------|---------|
| notification | User | Any notification |
| attendance:update | Admin, Personal | Attendance registered |
| activity:new | Admin, Personal, Assigned Specialists | Activity registered |
| report:new | Admin, Personal, Author | Report created |
| payment:new | Admin, Personal | Payment registered |
| enrollment:update | Admin, Personal | Enrollment status changed |