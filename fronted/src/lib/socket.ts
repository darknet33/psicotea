import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/auth";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

let socketInstance: Socket | null = null;

/**
 * Devuelve la instancia única de Socket.io. No conecta por sí sola: la
 * conexión se abre con `connectSocket`, que adjunta el JWT del handshake.
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return socketInstance;
}

export function connectSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;

  const socket = getSocket();
  socket.auth = { token: `Bearer ${token}` };
  if (!socket.connected) socket.connect();

  return socket;
}

export function disconnectSocket() {
  if (socketInstance && (socketInstance.connected || socketInstance.active)) {
    socketInstance.disconnect();
  }
}
