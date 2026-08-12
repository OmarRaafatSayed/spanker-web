import type { AuthResponse } from "@/types/flights";

const SESSION_KEY = "customer_portal_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { session?: { access_token?: string } };
    return parsed?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function saveSession(
  res: AuthResponse,
  extra?: { first_name?: string; last_name?: string; phone?: string }
) {
  if (typeof window === "undefined") return;
  const payload = {
    session: res.session,
    user: { ...res.user, ...(extra ?? {}) },
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data?.detail ?? data?.error ?? res.statusText), data);
  }
  return data as T;
}
