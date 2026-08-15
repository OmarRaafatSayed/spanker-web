/**
 * travel-requests-service.ts
 * ==========================
 * Service layer for all Supabase travel_request operations.
 *
 * WHY A SEPARATE SERVICE (not in crm-adapter):
 *   travel_requests live in Supabase and are queried via the Supabase JS SDK.
 *   The crm-adapter owns FastAPI HTTP calls. Mixing them would blur the boundary.
 *   Components import from ONE of: crm-adapter (FastAPI) or this service (Supabase).
 *
 * ALL methods return ServiceResult<T> — identical contract to crm-adapter.
 */

import { supabase } from "@/lib/supabase";
import { normalizeToPortalStatus } from "@/types/visa-states";
import type { ServiceResult } from "@/lib/services/crm-adapter";
import type {
  TravelRequest,
  TravelRequestForm,
  DocumentRequirement,
  CustomerDocument,
  ApiResponse,
} from "@/types";

// Re-export ServiceResult so callers import from one place
export type { ServiceResult };

// =============================================================================
// Helpers
// =============================================================================

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

function fail<T>(error: string, status?: number): ServiceResult<T> {
  return { ok: false, error, status };
}

// =============================================================================
// Travel Requests
// =============================================================================

export const travelRequestsService = {

  /** Create a new travel request. Fetches document checklist from Supabase RPC. */
  async create(data: TravelRequestForm, clientUserId?: string): Promise<ServiceResult<TravelRequest>> {
    try {
      // Prefer explicit userId (JWT auth) over Supabase Auth session
      let userId = clientUserId;
      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        userId = authData?.user?.id;
      }
      if (!userId) return fail("Not authenticated", 401);

      // Fetch document requirements for the chosen destination/type
      const { data: reqs } = await supabase
        .rpc("get_document_requirements", {
          dest_country: data.destination_country,
          trip_type:    data.travel_type,
        })
        .single();

      const mkItems = (arr: unknown) =>
        ((arr as string[]) ?? []).map(type => ({
          type,
          name: type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
          status: "pending" as const,
        }));

      const documentChecklist = {
        required: mkItems((reqs as { required_docs?: unknown } | null)?.required_docs),
        optional: mkItems((reqs as { optional_docs?: unknown } | null)?.optional_docs),
      };

      const { data: request, error } = await supabase
        .from("travel_requests")
        .insert([{
          client_user_id:       userId,
          destination_country:  data.destination_country,
          travel_type:          data.travel_type,
          departure_date:       data.departure_date ?? null,
          return_date:          data.return_date ?? null,
          traveler_count:       data.traveler_count,
          customer_notes:       data.customer_notes ?? null,
          document_checklist:   documentChecklist,
          next_action_required: "Upload required documents to complete your application",
        }])
        .select()
        .maybeSingle();

      if (error) return fail(error.message);
      if (!request) return fail("Insert succeeded but row was not returned — check RLS policies");
      return ok(request as TravelRequest);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  /** Fetch all travel requests for the current authenticated user. */
  async getMyRequests(): Promise<ServiceResult<TravelRequest[]>> {
    try {
      const { data, error } = await supabase.rpc("get_my_travel_requests");
      if (error) return fail(error.message);
      // Normalise status on every record (guards against raw integer from old rows)
      const normalised = ((data as TravelRequest[]) ?? []).map(req => ({
        ...req,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: normalizeToPortalStatus(req.status) as any,
      }));
      return ok(normalised);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  /** Fetch a single travel request by ID. */
  async getById(id: string): Promise<ServiceResult<TravelRequest>> {
    try {
      const { data, error } = await supabase
        .from("travel_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) return fail(error.message, error.code === "PGRST116" ? 404 : undefined);
      if (!data) return fail("Request not found", 404);
      const req = data as TravelRequest;
      return ok({ ...req, status: normalizeToPortalStatus(req.status) as typeof req.status });
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  /** Partial update of a travel request. */
  async update(id: string, updates: Partial<TravelRequest>): Promise<ServiceResult<TravelRequest>> {
    try {
      const { data, error } = await supabase
        .from("travel_requests")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) return fail(error.message);
      return ok(data as TravelRequest);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  /** Cancel a travel request with an optional reason. */
  async cancel(id: string, reason?: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await supabase
        .from("travel_requests")
        .update({
          status:      "cancelled",
          staff_notes: reason ? `Cancelled: ${reason}` : "Cancelled by customer",
          updated_at:  new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return fail(error.message);
      return ok(undefined);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },
};

// =============================================================================
// Document Requirements
// =============================================================================

export const documentRequirementsService = {

  async getRequirements(
    country: string,
    travelType: string
  ): Promise<ServiceResult<DocumentRequirement>> {
    try {
      const { data, error } = await supabase
        .from("document_requirements")
        .select("*")
        .eq("destination_country", country)
        .eq("travel_type", travelType)
        .single();
      if (error) return fail(error.message);
      return ok(data as DocumentRequirement);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  async getDestinations(): Promise<ServiceResult<string[]>> {
    try {
      const { data, error } = await supabase
        .from("document_requirements")
        .select("destination_country")
        .order("destination_country");
      if (error) return fail(error.message);
      const destinations = [
        ...new Set((data ?? []).map((d: { destination_country: string }) => d.destination_country)),
      ] as string[];
      return ok(destinations);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },
};

// =============================================================================
// Customer Documents (read / signed-URL operations)
// Write operations (upload/delete) stay in document-upload-service.ts
// to keep the fire-and-forget CRM notification in one place.
// =============================================================================

export const customerDocumentsService = {

  async getForRequest(requestId: string): Promise<ServiceResult<CustomerDocument[]>> {
    try {
      const { data, error } = await supabase
        .from("customer_documents")
        .select("*")
        .eq("travel_request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) return fail(error.message);
      return ok((data as CustomerDocument[]) ?? []);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },

  async getDownloadUrl(filePath: string): Promise<ServiceResult<string>> {
    try {
      const { data, error } = await supabase.storage
        .from("customer-documents")
        .createSignedUrl(filePath, 3600);
      if (error) return fail(error.message);
      return ok(data.signedUrl);
    } catch (err) {
      return fail(err instanceof Error ? err.message : "Unknown error");
    }
  },
};

// =============================================================================
// Legacy ApiResponse shim
// For any code that still uses ApiResponse<T> instead of ServiceResult<T>.
// Remove once migration is complete.
// =============================================================================

export function toApiResponse<T>(result: ServiceResult<T>): ApiResponse<T> {
  if (result.ok) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
