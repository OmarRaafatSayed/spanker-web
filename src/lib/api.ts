/**
 * API client — talks to the FastAPI backend only.
 * Frontend never touches Supabase directly (see INTEGRATION_GUIDE.md §2).
 */

import type {
  AuthResponse,
  FlightSearchRequest,
  FlightSearchResponse,
} from "@/types/flights";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const SESSION_KEY = "travel_crm_sb_session";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      session?: { access_token?: string };
    };
    return parsed?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function saveSession(data: AuthResponse): void {
  if (!data.session || !data.user) return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: data.user,
    })
  );
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    // Try to parse error from backend
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      message = body.detail ?? body.error ?? message;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.success && data.session) {
    saveSession(data);
  }
  return data;
}

export async function signup(
  email: string,
  password: string,
  first_name?: string,
  last_name?: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, first_name, last_name }),
  });
}

// ─── Flights ──────────────────────────────────────────────────────────────────

export async function searchFlights(
  params: FlightSearchRequest
): Promise<FlightSearchResponse> {
  return request<FlightSearchResponse>("/flights/search", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function testFlightConnection(): Promise<{ status: string }> {
  return request<{ status: string }>("/flights/test-connection");
}
