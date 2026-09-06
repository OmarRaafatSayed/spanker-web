"use client"

import { useEffect, useState, useCallback } from "react"
import { portalApi } from "@/lib/portal-api/client"
import type { DashboardResponse } from "@/modules/portal/types/portal.types"

export function usePortalDashboard() {
  const [data,      setData]      = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await portalApi.getDashboard()
      setData(res)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, isLoading, error, refresh: fetch }
}
