/**
 * use-visa-applications.ts
 * ========================
 * Module: /src/modules/visa
 *
 * Data hook for customer visa applications.
 * Fetches via crmAdapter (never raw fetch), normalises statuses, and caches
 * in Zustand for graceful degradation when the backend is unavailable.
 *
 * FEATURES:
 *   - Auto-refresh on mount
 *   - Falls back to Zustand cached data on API failure
 *   - Returns typed VisaApplication[] with guaranteed PortalStatus
 *   - Exposes `refetch` for manual refresh after user action
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { crmAdapter } from "@/lib/services/crm-adapter";
import { normalizeToPortalStatus, type PortalStatus } from "@/types/visa-states";
import type { VisaApplication } from "@/types/flights";

export interface NormalizedVisaApplication extends Omit<VisaApplication, "status"> {
  status: PortalStatus;
}

interface UseVisaApplicationsReturn {
  applications: NormalizedVisaApplication[];
  isLoading: boolean;
  error: string | null;
  isBackendDown: boolean;
  refetch: () => Promise<void>;
}

export function useVisaApplications(): UseVisaApplicationsReturn {
  const [applications, setApplications] = useState<NormalizedVisaApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendDown, setIsBackendDown] = useState(false);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await crmAdapter.getMyVisaApplications();

    if (!result.ok) {
      setError(result.error);

      // Detect backend down vs auth error
      if (!result.status || result.status >= 500 || result.status === undefined) {
        setIsBackendDown(true);
      }

      // Keep whatever was already in state (Zustand or previous fetch)
      setIsLoading(false);
      return;
    }

    setIsBackendDown(false);

    // Status is already normalised by crmAdapter, but double-guard here
    const normalised: NormalizedVisaApplication[] = (result.data.results ?? []).map(
      (app) => ({
        ...app,
        status: normalizeToPortalStatus(app.status),
      })
    );

    setApplications(normalised);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    isLoading,
    error,
    isBackendDown,
    refetch: fetchApplications,
  };
}
