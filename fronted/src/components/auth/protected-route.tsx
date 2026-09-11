"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user && !getAccessToken()) {
      router.replace(redirectTo);
    }
  }, [user, router, redirectTo]);

  if (!user) return null;

  return <>{children}</>;
}