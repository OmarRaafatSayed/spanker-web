/**
 * session-guard.tsx
 * =================
 * Module: /src/modules/auth
 *
 * SessionGuard — server-compatible route protection component.
 * Wraps any layout or page that requires an authenticated user.
 *
 * HOW IT WORKS:
 *   - On the client, reads token from localStorage via resolveToken().
 *   - If no valid token → redirects to /login.
 *   - If token present → renders children.
 *   - Shows a spinner during the initial hydration check to prevent flicker.
 *
 * USAGE (in a layout.tsx):
 *   import { SessionGuard } from "@/modules/auth/session-guard";
 *   export default function DashboardLayout({ children }) {
 *     return <SessionGuard>{children}</SessionGuard>;
 *   }
 */

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface SessionGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

export function SessionGuard({
  children,
  redirectTo = "/login",
}: SessionGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"hydrating" | "authenticated" | "unauthenticated">(
    "hydrating"
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setStatus("unauthenticated");
      router.replace(redirectTo);
    } else {
      setStatus("authenticated");
    }
  }, [redirectTo, router]);

  if (status === "hydrating") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Router.replace is async — render nothing while redirecting
    return null;
  }

  return <>{children}</>;
}
