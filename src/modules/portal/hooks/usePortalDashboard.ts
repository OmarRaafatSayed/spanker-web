"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { DashboardResponse } from "@/modules/portal/types/portal.types"

export function usePortalDashboard() {
  const [data,      setData]      = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await supabase.getDashboard()
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
