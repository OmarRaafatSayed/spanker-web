/**
 * crm-adapter.ts
 * ==============
 * Central integration adapter between the Next.js customer portal and the
 * FastAPI CRM backend.
 *
 * ARCHITECTURAL CONTRACT:
 *   - ALL FastAPI calls originate here. No component or hook calls fetch()
 *     directly against the CRM backend.
 *   - All public methods return `ServiceResult<T>` — never throw to callers.
 *
 * DEPENDENCIES:
 *   - api-client: HTTP fetch wrapper
 *   - token-resolver: Token extraction
 *   - retry-strategy: Exponential backoff
 *   - operation-queue: Async queue management
 *   - system-logger: Fire-and-forget logging
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

import { apiFetch, ok, fail, type ServiceResult } from "./api-client";
import { withRetry } from "./retry-strategy";
import { queueOperation, cancelOperation, getOperationState } from "./operation-queue";
import { logToSystemLogs } from "./system-logger";

// Re-export types and utilities for external use
export type { ServiceResult };
export { cancelOperation, getOperationState };

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
export { queueOperation };
