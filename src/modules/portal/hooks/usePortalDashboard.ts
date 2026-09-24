"use client"

import { useState, useCallback } from "react"
import { MOCK_DASHBOARD, MOCK_REQUESTS } from "@/lib/mock/data"
import type { DashboardResponse } from "@/modules/portal/types/portal.types"

export function usePortalDashboard() {
  const [data] = useState<DashboardResponse>({
    ...MOCK_DASHBOARD,
    latest_requests: MOCK_REQUESTS.slice(0, 5),
  })
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // no-op in mock mode
  }, [])

  return { data, isLoading, error, refresh }
}
