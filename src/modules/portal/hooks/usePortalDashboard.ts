"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { DashboardResponse } from "@/modules/portal/types/portal.types"

export function usePortalDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const [requestsResult, notificationsResult, docsResult] = await Promise.all([
        supabase
          .from("travel_requests")
          .select("*", { count: "exact" })
          .eq("client_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("portal_notifications")
          .select("*", { count: "exact" })
          .eq("customer_id", user.id)
          .eq("is_read", false),
        supabase
          .from("customer_documents")
          .select("*", { count: "exact" })
          .eq("client_user_id", user.id),
      ])

      const totalRequests = requestsResult.count ?? 0
      const unreadNotifications = notificationsResult.count ?? 0
      const totalDocs = docsResult.count ?? 0

      setData({
        total_requests: totalRequests,
        active_requests: totalRequests,
        completed_requests: 0,
        total_documents: totalDocs,
        pending_documents: 0,
        approved_documents: 0,
        rejected_documents: 0,
        unread_notifications: unreadNotifications,
        latest_requests: requestsResult.data ?? [],
      } as unknown as DashboardResponse)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  return { data, isLoading, error, refresh: fetchDashboard }
}
