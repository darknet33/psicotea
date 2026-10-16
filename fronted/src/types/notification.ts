export type NotificationType = "info" | "success" | "warning" | "error";

export interface RealtimeNotificationPayload {
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
  timestamp?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, unknown>;
  timestamp: string;
  read: boolean;
}
