"use client"

import { useState, useCallback, useEffect } from "react"
import type { DashboardResponse } from "@/modules/portal/types/portal.types"

/**
 * usePortalDashboard
 *
 * Fetches live dashboard data from GET /api/v1/portal/dashboard.
 *
 * Requirements: 1.3, 1.4, 1.5, 8.1, 8.2, 8.4
 *
 * Bug_Condition: hook returned MOCK_DASHBOARD with isLoading: false immediately;
 *   refresh() was a no-op.
 * Expected_Behavior: hook calls GET /api/v1/portal/dashboard and returns live
 *   data scoped to the authenticated user.
 *
 * Preservation: return shape { data, isLoading, error, refresh } unchanged;
 *   components require zero changes.
 */
export function usePortalDashboard() {
  const [data,      setData]      = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/v1/portal/dashboard")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData?.error?.message ??
          `Failed to load dashboard (HTTP ${response.status})`
        )
      }

      const json = await response.json()
      setData(json.data as DashboardResponse)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const refresh = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  return { data, isLoading, error, refresh }
}
