/**
 * api-client.ts
 * Low-level HTTP wrapper over CRM backend.
 * Single responsibility: HTTP requests + response parsing only.
 */

import { resolveToken } from "./token-resolver";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T>(error: string, status?: number): ServiceResult<T> {
  return { ok: false, error, status };
}

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "/api/backend")
    : (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1");

export interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  token?: string | null;
  anonymous?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ServiceResult<T>> {
  const { token: explicitToken, anonymous = false, headers: extraHeaders, ...rest } = options;

  const token = anonymous ? null : (explicitToken ?? resolveToken());

  if (!anonymous && !token) {
    return fail<T>("No active session. Please log in.", 401);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const status = res.status;
      
      if (status === 503 || status === 502 || status === 504) {
        return fail<T>("جاري تحديث أسعار الرحلات، يمكنك مواصلة الحجز أو ترك بياناتك وسنقوم بالتواصل معك فوراً.", status);
      }
      
      const message =
        typeof body?.detail === "string"
          ? body.detail
          : typeof body?.error === "string"
            ? body.error
            : `Request failed: ${status} ${res.statusText}`;
      return fail<T>(message, status);
    }

    const data = (await res.json()) as T;
    return ok(data);
  } catch (err) {
    const message = err instanceof TypeError
      ? `Network error: CRM backend unreachable. Is the FastAPI server running?`
      : String(err);
    return fail<T>(message);
  }
}
