"use client";

/**
 * use-visa-applications.ts
 * ========================
 * Fetches the customer's travel requests from Supabase directly
 * (via server-side API route to bypass RLS).
 * Falls back gracefully when the backend is unavailable.
 */

import { useEffect, useState, useCallback } from "react";
import { normalizeToPortalStatus, type PortalStatus } from "@/types/visa-states";
import type { VisaApplication } from "@/types/flights";
import type { TravelRequest } from "@/types";

export interface NormalizedVisaApplication extends Omit<VisaApplication, "status"> {
  status: PortalStatus;
}

interface UseVisaApplicationsReturn {
  applications: NormalizedVisaApplication[];
  travelRequests: TravelRequest[];
  isLoading: boolean;
  error: string | null;
  isBackendDown: boolean;
  refetch: () => Promise<void>;
}

export function useVisaApplications(): UseVisaApplicationsReturn {
  const [applications, setApplications]     = useState<NormalizedVisaApplication[]>([]);
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [isBackendDown, setIsBackendDown]   = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsBackendDown(false);

    try {
      // Get user id from localStorage session
      let userId: string | null = null;
      try {
        const raw = localStorage.getItem("customer_portal_session");
        if (raw) {
          const parsed = JSON.parse(raw) as { user?: { id?: string } };
          userId = parsed?.user?.id ?? null;
        }
      } catch { /* ignore */ }

      if (!userId) {
        setError("Not authenticated");
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/travel-requests/my-requests?userId=${encodeURIComponent(userId)}`);

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        setError(json.error ?? `Error ${res.status}`);
        if (res.status >= 500) setIsBackendDown(true);
        setIsLoading(false);
        return;
      }

      const json = await res.json() as { data?: TravelRequest[] };
      const requests = json.data ?? [];
      setTravelRequests(requests);

      // Map TravelRequest → NormalizedVisaApplication shape for the existing UI
      const mapped: NormalizedVisaApplication[] = requests.map((r) => ({
        id:                  r.id,
        client_user_id:      r.client_user_id,
        created_by:          r.client_user_id,
        client_name:         "",
        passport_number:     "",
        destination_country: r.destination_country,
        status:              normalizeToPortalStatus(r.status),
        appointment_date:    r.next_follow_up_date ?? null,
        notes:               r.customer_notes ?? null,
        created_at:          r.created_at,
        updated_at:          r.updated_at,
      }));

      setApplications(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      setIsBackendDown(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  return { applications, travelRequests, isLoading, error, isBackendDown, refetch: fetchApplications };
}
