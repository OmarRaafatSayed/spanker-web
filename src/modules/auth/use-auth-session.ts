/**
 * use-auth-session.ts
 * ===================
 * Module: /src/modules/auth
 *
 * Unified auth session hook — single place for all token and user state.
 * Reads from both session namespaces and exposes a clean interface.
 *
 * REPLACES:
 *   - auth-context.tsx direct localStorage reads scattered around the app
 *   - Manual token checks in API routes
 *
 * USAGE:
 *   const { user, token, isLoading, logout } = useAuthSession();
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { resolveToken } from "@/lib/services/token-resolver";

const SESSION_KEYS = ["customer_portal_session", "travel_crm_sb_session"] as const;

interface SessionUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthSessionState {
  user: SessionUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useAuthSession(): AuthSessionState {
  const zustandUser = useAuthStore((s) => s.user);
  const zustandLogout = useAuthStore((s) => s.logout);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const resolvedToken = resolveToken();
    setToken(resolvedToken);

    if (!resolvedToken) {
      setIsLoading(false);
      return;
    }

    // Try to find user data in any session store
    for (const key of SESSION_KEYS) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as { user?: SessionUser };
        if (parsed?.user?.id) {
          setUser(parsed.user);
          break;
        }
      } catch {
        // corrupt entry — skip
      }
    }

    // Zustand persisted user takes precedence (more complete profile data)
    if (zustandUser) {
      setUser({
        id: zustandUser.id,
        email: zustandUser.email,
      });
    }

    setIsLoading(false);
  }, [zustandUser]);

  const logout = useCallback(() => {
    // Clear all known session namespaces
    for (const key of SESSION_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    setToken(null);
    setUser(null);
    zustandLogout();
  }, [zustandLogout]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    logout,
  };
}
