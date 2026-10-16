"use client";

import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NotificationCenter() {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notificaciones (${unreadCount} sin leer)`
              : "Notificaciones"
          }
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notificaciones</DropdownMenuLabel>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Marcar todas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center text-sm text-muted-foreground">
            <Inbox className="size-5" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => markAsRead(notification.id)}
                className={cn(
                  "flex cursor-default flex-col items-start gap-0.5 py-2",
                  !notification.read && "bg-accent/50",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {notification.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(notification.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.message}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
