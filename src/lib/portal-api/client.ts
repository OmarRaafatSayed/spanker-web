// =============================================================================
// Portal API Client — typed fetch wrapper for FastAPI /api/v1/portal/* endpoints
// =============================================================================

import { supabase } from "@/lib/supabase/client"
import type {
  ProfileSetupRequest,
  ProfileResponse,
  CreateRequestBody,
  RequestResponse,
  RequestDetailResponse,
  RegisterDocumentBody,
  DocumentResponse,
  NotificationResponse,
  DashboardResponse,
} from "@/modules/portal/types/portal.types"

// Use the Next.js proxy (/api/backend → FastAPI) to avoid CORS issues in the browser.
// In production set NEXT_PUBLIC_API_BASE to your domain (e.g. https://yourdomain.com).
const BASE = (
  typeof window === "undefined"
    // Server-side: call FastAPI directly (no CORS issue)
    ? (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1")
    // Client-side: go through Next.js proxy (same origin → no CORS)
    : "/api/backend"
) + "/portal"

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error("Not authenticated")
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

async function portalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(BASE + path, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail ?? detail
    } catch { /* ignore parse error */ }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

export const portalApi = {
  // ── Profile ────────────────────────────────────────────────────────────────
  setupProfile: (body: ProfileSetupRequest) =>
    portalFetch<ProfileResponse>("/profile/setup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getProfile: () =>
    portalFetch<ProfileResponse>("/profile"),

  // ── Requests ───────────────────────────────────────────────────────────────
  createRequest: (body: CreateRequestBody) =>
    portalFetch<RequestResponse>("/requests", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listRequests: (params?: { status_filter?: string; limit?: number; offset?: number }) =>
    portalFetch<{ requests: RequestResponse[]; total: number }>(
      "/requests?" + new URLSearchParams(params as Record<string, string>)
    ),

  getRequest: (id: string) =>
    portalFetch<RequestDetailResponse>(`/requests/${id}`),

  updateRequest: (id: string, body: Partial<CreateRequestBody>) =>
    portalFetch<RequestResponse>(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // ── Documents ──────────────────────────────────────────────────────────────
  registerDocument: (requestId: string, body: RegisterDocumentBody) =>
    portalFetch<DocumentResponse>(`/requests/${requestId}/documents`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteDocument: (requestId: string, docId: string) =>
    portalFetch<{ success: boolean }>(`/requests/${requestId}/documents/${docId}`, {
      method: "DELETE",
    }),

  // ── Notifications ──────────────────────────────────────────────────────────
  listNotifications: (params?: { unread_only?: boolean; limit?: number }) =>
    portalFetch<{ notifications: NotificationResponse[]; total: number; unread_count: number }>(
      "/notifications?" + new URLSearchParams(params as Record<string, string>)
    ),

  markRead: (id: string) =>
    portalFetch<{ success: boolean }>(`/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    portalFetch<{ success: boolean; marked_read: number }>("/notifications/read-all", {
      method: "POST",
    }),

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: () =>
    portalFetch<DashboardResponse>("/dashboard"),
}
