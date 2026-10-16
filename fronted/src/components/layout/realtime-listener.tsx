"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { RealtimeNotificationPayload } from "@/types/notification";

interface ActivityEvent {
  activity?: { title?: string };
}

/**
 * Conecta el WebSocket cuando hay sesión y traduce los eventos del backend a
 * notificaciones del store, además de mostrar toasts para los eventos
 * relevantes. Las notificaciones son efímeras (no se persisten).
 */
export function RealtimeListener() {
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!userId) return;

    const socket = connectSocket();
    if (!socket) return;

    const onNotification = (payload: RealtimeNotificationPayload) => {
      useNotificationStore.getState().add(payload);
      toast(payload.title, { description: payload.message });
    };

    const onActivity = (event: ActivityEvent) => {
      const title = event?.activity?.title ?? "una actividad";
      const notification: RealtimeNotificationPayload = {
        title: "Nueva actividad",
        message: `Se registró "${title}".`,
        type: "success",
      };
      useNotificationStore.getState().add(notification);
      toast.success(notification.title, { description: notification.message });
    };

    const onAttendance = () => {
      useNotificationStore.getState().add({
        title: "Asistencia actualizada",
        message: "Se actualizó la asistencia de un niño.",
      });
    };

    const onReport = () => {
      useNotificationStore.getState().add({
        title: "Nuevo informe",
        message: "Se registró un informe de un niño.",
      });
    };

    const onPayment = () => {
      useNotificationStore.getState().add({
        title: "Nuevo pago",
        message: "Se registró un pago.",
        type: "success",
      });
    };

    const onEnrollment = () => {
      useNotificationStore.getState().add({
        title: "Inscripción actualizada",
        message: "Se actualizó una inscripción.",
      });
    };

    socket.on("notification", onNotification);
    socket.on("attendance:update", onAttendance);
    socket.on("activity:new", onActivity);
    socket.on("report:new", onReport);
    socket.on("payment:new", onPayment);
    socket.on("enrollment:update", onEnrollment);

    return () => {
      socket.off("notification", onNotification);
      socket.off("attendance:update", onAttendance);
      socket.off("activity:new", onActivity);
      socket.off("report:new", onReport);
      socket.off("payment:new", onPayment);
      socket.off("enrollment:update", onEnrollment);
      disconnectSocket();
    };
  }, [userId]);

  return null;
}
