/**
 * crm-adapter.ts
 * ==============
 * Central integration adapter between the Next.js customer portal and the
 * FastAPI CRM backend.
 *
 * ARCHITECTURAL CONTRACT:
 *   - ALL FastAPI calls originate here. No component or hook calls fetch()
 *     directly against the CRM backend.
 *   - Supabase SDK calls for cross-system side effects (logging, status sync)
 *     also route through here so retries and error handling are centralised.
 *   - All public methods return `ServiceResult<T>` — never throw to callers.
 *   - Token resolution is automatic: reads from both session key namespaces
 *     (`customer_portal_session` and `travel_crm_sb_session`) so staff and
 *     customers are handled uniformly.
 *
 * USAGE:
 *   import { crmAdapter } from "@/lib/services/crm-adapter";
 *   const result = await crmAdapter.getMyVisaApplications();
 *   if (!result.ok) { show fallback UI }
 */

import { supabase } from "@/lib/supabase";
import {
  mapCrmStatusToPortal,
  mapPortalStatusToCrm,
  normalizeToPortalStatus,
  type PortalStatus,
  type CrmStatusCode,
} from "@/types/visa-states";
import type {
  VisaApplicationsResponse,
  PaymentsResponse,
  CustomerProfile,
  UpdateProfileRequest,
  FlightSearchRequest,
  FlightSearchResponse,
} from "@/types/flights";
import type { CRMStatusUpdate } from "@/types";

// =============================================================================
// Result wrapper — discriminated union keeps callers honest
// =============================================================================

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string, status?: number): ServiceResult<T> {
  return { ok: false, error, status };
}

// =============================================================================
// Token resolution
// Known session keys across both sub-projects.
// =============================================================================

const SESSION_KEYS = [
  "customer_portal_session",  // spanker Next.js portal
  "travel_crm_sb_session",    // travel-agency-custom CRM
] as const;

interface StoredSession {
  session?: {
    access_token?: string;
    expires_at?: number;
  };
  user?: { id: string; email: string };
}

/**
 * Resolves a valid, non-expired Bearer token from any known session storage key.
 * Returns null if no valid session is found.
 */
export function resolveToken(): string | null {
  if (typeof window === "undefined") return null;

  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const key of SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as StoredSession;
      const token = parsed?.session?.access_token;
      const expiresAt = parsed?.session?.expires_at;

      if (!token) continue;

      // Token expired (with 60s leeway for clock skew)
      if (expiresAt && expiresAt - 60 <= nowSeconds) {
        console.warn(`[crm-adapter] Token in "${key}" is expired. Skipping.`);
        continue;
      }

      return token;
    } catch {
      // Corrupt JSON — skip silently
    }
  }

  return null;
}

// =============================================================================
// Low-level fetch wrapper
// =============================================================================

// Base URL: Next.js rewrites /api/backend/* → FastAPI at localhost:8000/api/v1/*
// Use the rewrite in the browser; for SSR use BACKEND_INTERNAL_URL env var.
const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "/api/backend")
    : (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1");

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  /** Pass explicit token — if omitted, resolveToken() is used automatically */
  token?: string | null;
  /** If true, skip auth header (public endpoints) */
  anonymous?: boolean;
}

async function apiFetch<T>(
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
      
      // Handle 503 Service Unavailable gracefully for UX
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

// =============================================================================
// System log helper (fire-and-forget, never throws)
// =============================================================================

async function logToSystemLogs(
  level: "info" | "success" | "warning" | "error",
  event: string,
  details?: string,
  source: "webhook" | "crm" | "cms" | "auth" | "system" = "crm",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("system_logs").insert([{
      level,
      event,
      details: details ?? null,
      source,
      metadata: metadata ?? {},
    }]);
  } catch (err) {
    // Logging must never crash the application
    console.error("[crm-adapter] Failed to write system log:", err);
  }
}

// =============================================================================
// Async Queue — For managing async operations with retry and backoff
// =============================================================================

interface QueuedOperation<T> {
  id: string;
  fn: () => Promise<ServiceResult<T>>;
  maxAttempts: number;
  baseDelayMs: number;
  status: "pending" | "running" | "completed" | "failed" | "abandoned";
  result?: ServiceResult<T>;
  createdAt: number;
  lastAttemptAt?: number;
}

const operationQueue = new Map<string, QueuedOperation<unknown>>();

/**
 * Adds an operation to the retry queue with automatic exponential backoff.
 * Returns a promise that resolves when the operation completes or fails permanently.
 */
function queueOperation<T>(
  id: string,
  fn: () => Promise<ServiceResult<T>>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<ServiceResult<T>> {
  return new Promise<ServiceResult<T>>((resolve) => {
    const operation: QueuedOperation<T> = {
      id,
      fn,
      maxAttempts: options.maxAttempts ?? 3,
      baseDelayMs: options.baseDelayMs ?? 1000,
      status: "pending",
      createdAt: Date.now(),
    };

    operationQueue.set(id, operation);
    processQueueItem(id, operation).then((result) => {
      resolve(result);
      // Clean up after completion
      operationQueue.delete(id);
    });
  });
}

/**
 * Process a single queue item with exponential backoff retry logic.
 */
async function processQueueItem<T>(
  id: string,
  operation: QueuedOperation<T>
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T> = fail<T>("Not attempted");

  for (let attempt = 1; attempt <= operation.maxAttempts; attempt++) {
    operation.status = "running";
    operation.lastAttemptAt = Date.now();
    operationQueue.set(id, operation);

    lastResult = await operation.fn();

    if (lastResult.ok) {
      operation.status = "completed";
      operation.result = lastResult;
      operationQueue.set(id, operation);
      return lastResult;
    }

    // Don't retry on auth errors or client errors (4xx)
    if (lastResult.status && lastResult.status >= 400 && lastResult.status < 500) {
      operation.status = "failed";
      operation.result = lastResult;
      operationQueue.set(id, operation);
      return lastResult;
    }

    if (attempt < operation.maxAttempts) {
      const delay = operation.baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  operation.status = "failed";
  operation.result = lastResult;
  operationQueue.set(id, operation);
  return lastResult;
}

/**
 * Cancels a pending/running operation by ID.
 */
function cancelOperation(id: string): boolean {
  const op = operationQueue.get(id);
  if (op && (op.status === "pending" || op.status === "running")) {
    op.status = "abandoned";
    operationQueue.set(id, op);
    return true;
  }
  return false;
}

/**
 * Gets the current state of a queued operation.
 */
function getOperationState<T>(id: string): QueuedOperation<T> | undefined {
  return operationQueue.get(id) as QueuedOperation<T> | undefined;
}

// =============================================================================
// Retry utility — exponential backoff, max 3 attempts
// =============================================================================

async function withRetry<T>(
  fn: () => Promise<ServiceResult<T>>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T> = fail<T>("Not attempted");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await fn();
    if (lastResult.ok) return lastResult;

    // Don't retry on auth errors or client errors (4xx)
    if (lastResult.status && lastResult.status >= 400 && lastResult.status < 500) {
      return lastResult;
    }

    if (attempt < maxAttempts) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return lastResult;
}

// =============================================================================
// CRM Adapter — public API surface
// =============================================================================

export const crmAdapter = {

  // ---------------------------------------------------------------------------
  // AUTH
  // ---------------------------------------------------------------------------

  async login(email: string, password: string): Promise<ServiceResult<{
    user: { id: string; email: string };
    session: { access_token: string; refresh_token: string; expires_at: number };
  }>> {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      anonymous: true,
    });
  },

  async signup(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
    role = "customer"
  ): Promise<ServiceResult<{
    user: { id: string; email: string };
    session: { access_token: string; refresh_token: string; expires_at: number } | null;
    email_confirmation_required?: boolean;
    message?: string;
  }>> {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
      }),
      anonymous: true,
    });
  },

  // ---------------------------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------------------------

  async getProfile(): Promise<ServiceResult<CustomerProfile>> {
    return apiFetch<CustomerProfile>("/profile/me");
  },

  async updateProfile(data: UpdateProfileRequest): Promise<ServiceResult<CustomerProfile>> {
    return apiFetch<CustomerProfile>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // ---------------------------------------------------------------------------
  // VISA APPLICATIONS
  // Normalises integer CRM status → PortalStatus on every response.
  // ---------------------------------------------------------------------------

  async getMyVisaApplications(filters?: {
    status?: PortalStatus;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResult<VisaApplicationsResponse>> {
    const params = new URLSearchParams();
    if (filters?.status) {
      const crmCode = mapPortalStatusToCrm(filters.status);
      params.set("status", String(crmCode));
    }
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const result = await apiFetch<VisaApplicationsResponse>(
      `/visa/my-applications${qs ? `?${qs}` : ""}`
    );

    if (!result.ok) {
      // Fallback: staff endpoint filtered by JWT identity
      const fallback = await apiFetch<VisaApplicationsResponse>(
        `/visa/applications${qs ? `?${qs}` : ""}`
      );
      if (!fallback.ok) return fallback;

      // Cast through unknown: normalising status field to portal slug
      // VisaApplication.status is typed as VisaStatus in flights.ts — we widen here
      const normalized = {
        ...fallback.data,
        results: (fallback.data.results ?? []).map(app => ({
          ...app,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: normalizeToPortalStatus(app.status) as any,
        })),
      } as VisaApplicationsResponse;
      return ok(normalized);
    }

    // Normalize status on every returned record
    const normalized = {
      ...result.data,
      results: (result.data.results ?? []).map(app => ({
        ...app,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: normalizeToPortalStatus(app.status) as any,
      })),
    } as VisaApplicationsResponse;
    return ok(normalized);
  },

  /**
   * Update visa status from the portal side.
   * Translates PortalStatus → CRM integer before sending.
   */
  async updateVisaStatus(
    applicationId: string,
    newStatus: PortalStatus
  ): Promise<ServiceResult<{ success: boolean; new_status: number; status_name: string }>> {
    const crmCode: CrmStatusCode = mapPortalStatusToCrm(newStatus);
    return apiFetch(`/visa/applications/${applicationId}/status?new_status=${crmCode}`, {
      method: "PATCH",
    });
  },

  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------

  async getMyPayments(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResult<PaymentsResponse>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));

    const qs = params.toString();
    const result = await apiFetch<PaymentsResponse>(
      `/payments/my-payments${qs ? `?${qs}` : ""}`
    );

    if (!result.ok) {
      // Fallback to generic payments endpoint
      return apiFetch<PaymentsResponse>(`/payments${qs ? `?${qs}` : ""}`);
    }

    return result;
  },

  // ---------------------------------------------------------------------------
  // FLIGHTS
  // ---------------------------------------------------------------------------

  async searchFlights(params: FlightSearchRequest): Promise<ServiceResult<FlightSearchResponse>> {
    return apiFetch<FlightSearchResponse>("/flights/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  // ---------------------------------------------------------------------------
  // CRM WEBHOOK PROCESSING
  // Processes a validated webhook payload. Writes to Supabase directly
  // since this runs server-side in the Next.js API route.
  // ---------------------------------------------------------------------------

  async processCrmWebhook(update: CRMStatusUpdate): Promise<ServiceResult<void>> {
    try {
      // 1. Normalize status from CRM integer or portal string
      const portalStatus = normalizeToPortalStatus(update.status);

      // 2. Fetch the request to get client_user_id for the comms insert
      const { data: req, error: fetchError } = await supabase
        .from("travel_requests")
        .select("client_user_id")
        .eq("id", update.tracking_id)
        .single();

      if (fetchError) {
        await logToSystemLogs(
          "error",
          "crm_webhook_fetch_failed",
          `tracking_id=${update.tracking_id}: ${fetchError.message}`,
          "webhook",
          { tracking_id: update.tracking_id }
        );
        return fail<void>(`Could not find request ${update.tracking_id}: ${fetchError.message}`);
      }

      // 3. Update travel_request status
      const { error: updateError } = await supabase
        .from("travel_requests")
        .update({
          status: portalStatus,
          staff_notes: update.message,
          assigned_staff_id: update.staff_id ?? null,
          updated_at: update.timestamp,
        })
        .eq("id", update.tracking_id);

      if (updateError) {
        await logToSystemLogs(
          "error",
          "crm_webhook_update_failed",
          `tracking_id=${update.tracking_id}: ${updateError.message}`,
          "webhook",
          { tracking_id: update.tracking_id, status: portalStatus }
        );
        return fail<void>(updateError.message);
      }

      // 4. Sync document statuses if provided
      if (update.document_updates?.length) {
        for (const du of update.document_updates) {
          await supabase
            .from("customer_documents")
            .update({ status: du.status, updated_at: update.timestamp })
            .eq("travel_request_id", update.tracking_id)
            .eq("document_type", du.type);
        }
        await supabase.rpc("update_document_completion", {
          request_id: update.tracking_id,
        });
      }

      // 5. Log communication event
      if (req?.client_user_id) {
        await supabase.from("customer_communications").insert([{
          travel_request_id: update.tracking_id,
          client_user_id: req.client_user_id,
          staff_user_id: update.staff_id ?? null,
          communication_type: "system_notification",
          message: update.message,
          sent_at: update.timestamp,
        }]);
      }

      // 6. Audit log
      await logToSystemLogs(
        "success",
        "crm_webhook_processed",
        `Request ${update.tracking_id} → status: ${portalStatus}`,
        "webhook",
        { tracking_id: update.tracking_id, new_status: portalStatus }
      );

      return ok(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await logToSystemLogs("error", "crm_webhook_exception", message, "webhook");
      return fail<void>(message);
    }
  },

  /**
   * Notify the CRM of a document upload.
   * ASYNC / FIRE-AND-FORGET: upload already succeeded locally before this is called.
   * Failures are logged to system_logs — never surfaced to the user.
   *
   * @param requestId    travel_request.id
   * @param documentType the document type slug (e.g. "passport")
   * @param filePath     storage path in Supabase bucket
   */
  async notifyCrmDocumentUploaded(
    requestId: string,
    documentType: string,
    filePath: string
  ): Promise<void> {
    const notify = async (): Promise<ServiceResult<void>> =>
      apiFetch<void>(`/travel-requests/${requestId}/document-notify`, {
        method: "POST",
        body: JSON.stringify({ document_type: documentType, file_path: filePath }),
      });

    const result = await withRetry(notify, 3, 1000);

    if (!result.ok) {
      await logToSystemLogs(
        "warning",
        "crm_document_notify_failed",
        `requestId=${requestId} type=${documentType}: ${result.error}`,
        "crm",
        { requestId, documentType, filePath, error: result.error }
      );
    }
  },

  // ---------------------------------------------------------------------------
  // AUTH — change password
  // ---------------------------------------------------------------------------

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    return apiFetch<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password:     newPassword,
      }),
    });
  },

  /**
   * Health check — useful for dashboard degradation logic.
   * Returns true if the CRM backend is reachable.
   */
  async isBackendReachable(): Promise<boolean> {
    const result = await apiFetch<{ status: string }>("/health", { anonymous: true });
    return result.ok;
  },
};

// Named export so adapters can be extended or mocked in tests
export type CrmAdapter = typeof crmAdapter;

// Re-export async queue utilities for use in other modules
export { queueOperation, cancelOperation, getOperationState };
