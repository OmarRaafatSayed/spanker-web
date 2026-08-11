"use client";

/**
 * auth-context.tsx
 * ================
 * REFACTORED (Task 2):
 *   - login / signup now route through crmAdapter (no raw api.ts imports)
 *   - Session persistence handled by crmAdapter's resolveToken() contract
 *   - saveSession / clearSession are internal helpers here only
 *   - updateUserProfile persists to both React state and localStorage
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { crmAdapter } from "@/lib/services/crm-adapter";
import type { AuthResponse } from "@/types/flights";

// =============================================================================
// Session persistence helpers (internal to this module)
// =============================================================================

const SESSION_KEY = "customer_portal_session";

interface StoredPayload {
  session?: { access_token?: string; refresh_token?: string; expires_at?: number };
  user?: AuthUser;
}

function persistSession(session: NonNullable<AuthResponse["session"]>, user: AuthUser): void {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      session: { ...session, expires_at: expiresAt },
      user,
    }));
  } catch { /* private browsing / quota */ }
}

function clearPersistedSession(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem("travel_crm_sb_session"); } catch { /* ignore */ }
}

// =============================================================================
// Types
// =============================================================================

interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login:    (email: string, password: string) => Promise<AuthResponse>;
  signup:   (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<AuthResponse>;
  logout:   () => void;
  updateUserProfile: (data: Partial<Pick<AuthUser, "first_name" | "last_name" | "phone">>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredPayload;
        const t          = parsed?.session?.access_token;
        const expiresAt  = parsed?.session?.expires_at;
        const u          = parsed?.user;
        const nowSeconds = Math.floor(Date.now() / 1000);

        if (t && u && (!expiresAt || expiresAt - 60 > nowSeconds)) {
          setToken(t);
          setUser(u);
        } else {
          clearPersistedSession();
        }
      }
    } catch {
      // Corrupt storage — wipe it
      clearPersistedSession();
    }
    setIsLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    const result = await crmAdapter.login(email, password);

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    const { user: apiUser, session } = result.data;
    const authUser: AuthUser = { id: apiUser.id, email: apiUser.email };

    persistSession(session, authUser);
    setUser(authUser);
    setToken(session.access_token);

    return {
      success: true,
      user:    apiUser,
      session: { access_token: session.access_token, refresh_token: session.refresh_token },
    };
  }, []);

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (
    email:     string,
    password:  string,
    firstName?: string,
    lastName?:  string,
    phone?:     string,
  ): Promise<AuthResponse> => {
    const result = await crmAdapter.signup(email, password, firstName, lastName, phone, "customer");

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    const { user: apiUser, session, email_confirmation_required, message } = result.data;

    // Email confirmation path — no session yet
    if (email_confirmation_required || !session) {
      return { success: true, email_confirmation_required: true, message };
    }

    const authUser: AuthUser = {
      id:         apiUser.id,
      email:      apiUser.email,
      first_name: firstName,
      last_name:  lastName,
      phone,
    };

    persistSession(session, authUser);
    setUser(authUser);
    setToken(session.access_token);

    return {
      success: true,
      user:    apiUser,
      session: { access_token: session.access_token, refresh_token: session.refresh_token },
    };
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearPersistedSession();
    setUser(null);
    setToken(null);
  }, []);

  // ── Profile update ─────────────────────────────────────────────────────────
  const updateUserProfile = useCallback(
    (data: Partial<Pick<AuthUser, "first_name" | "last_name" | "phone">>) => {
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, ...data };
        try {
          const raw = localStorage.getItem(SESSION_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as StoredPayload;
            localStorage.setItem(SESSION_KEY, JSON.stringify({ ...parsed, user: updated }));
          }
        } catch { /* ignore */ }
        return updated;
      });
    },
    []
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
