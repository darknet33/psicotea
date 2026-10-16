import { create } from "zustand";
import type {
  AppNotification,
  RealtimeNotificationPayload,
} from "@/types/notification";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: () => number;
  add: (payload: RealtimeNotificationPayload) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
}

/**
 * Store en memoria de la sesión: las notificaciones son efímeras (el backend
 * no las persiste) y se pierden al recargar la página.
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  unreadCount: () => get().notifications.filter((item) => !item.read).length,

  add: (payload) => {
    const notification: AppNotification = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: payload.title,
      message: payload.message,
      type: payload.type ?? "info",
      data: payload.data,
      timestamp: payload.timestamp ?? new Date().toISOString(),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    }));

    return notification;
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    })),

  clear: () => set({ notifications: [] }),
}));
