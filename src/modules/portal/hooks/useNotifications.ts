"use client"

import { useEffect, useState, useCallback } from "react"
import { portalApi } from "@/lib/portal-api/client"
import type { NotificationResponse } from "@/modules/portal/types/portal.types"

export function useNotifications(unread_only = false) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [total,         setTotal]         = useState(0)
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await portalApi.listNotifications({ unread_only, limit: 50 })
      setNotifications(res.notifications)
      setTotal(res.total)
      setUnreadCount(res.unread_count)
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load notifications")
    } finally {
      setIsLoading(false)
    }
  }, [unread_only])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    await portalApi.markRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await portalApi.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  /** Push a realtime notification from usePortalRealtime */
  const pushNotification = useCallback((notif: NotificationResponse) => {
    setNotifications(prev => [notif, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  return {
    notifications, total, unreadCount, isLoading, error,
    refresh: fetchNotifications, markRead, markAllRead, pushNotification,
  }
}
