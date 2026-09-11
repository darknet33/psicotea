"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getAccessToken } from "@/lib/auth";
import type { Role } from "@/types/user";

export function RoleBasedRoute({
  allowedRoles,
  children,
  redirectTo = "/dashboard",
  fallback = null,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user && !getAccessToken()) {
      router.replace("/login");
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      router.replace(redirectTo);
    }
  }, [user, allowedRoles, router, redirectTo]);

  if (!user || !allowedRoles.includes(user.role)) return fallback;

  return <>{children}</>;
}