"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { login as apiLogin, signup as apiSignup, clearSession, getAccessToken } from "@/lib/api";
import type { AuthResponse } from "@/types/flights";

const SESSION_KEY = "travel_crm_sb_session";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          session?: { access_token?: string; expires_at?: number };
          user?: AuthUser;
        };
        const t = parsed?.session?.access_token;
        const expiresAt = parsed?.session?.expires_at;
        const u = parsed?.user;
        // Check token not expired (expires_at is unix seconds)
        const now = Math.floor(Date.now() / 1000);
        if (t && u && (!expiresAt || expiresAt > now)) {
          setToken(t);
          setUser(u);
        } else {
          // Expired — clear
          clearSession();
        }
      }
    } catch {
      // corrupt storage
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiLogin(email, password);
    if (res.success && res.user && res.session) {
      setUser(res.user);
      setToken(res.session.access_token);
    }
    return res;
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> => {
    return apiSignup(email, password, firstName, lastName);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
