"use client"

/**
 * useNotifications
 *
 * Fetches live notifications from GET /api/v1/portal/notifications and
 * subscribes to Supabase Realtime for instant INSERT pushes.
 *
 * Requirements: 3.5, 3.6, 3.7, 3.8, 8.1, 8.2, 8.3, 8.4
 *
 * Bug_Condition: hook read from module-scope `let _notifications` (MOCK data);
 *   no Realtime subscription; markRead only mutated in-memory.
 * Expected_Behavior: notifications fetched from Supabase; new INSERTs pushed
 *   via Realtime without manual refresh; markRead / markAllRead call real APIs.
 *
 * Preservation: pushNotification() remains callable by external callers
 *   (e.g. usePortalRealtime); all return fields unchanged.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { NotificationResponse } from "@/modules/portal/types/portal.types"

export function useNotifications(unread_only = false) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [total,         setTotal]         = useState(0)
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [isLoading,     setIsLoading]     = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  // Keep a stable ref to the current notifications for use inside callbacks
  const notificationsRef = useRef<NotificationResponse[]>([])
  notificationsRef.current = notifications

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async (): Promise<string | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const url = `/api/v1/portal/notifications?unread_only=${unread_only}`
      const response = await fetch(url)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(
          errData?.error?.message ??
          `Failed to load notifications (HTTP ${response.status})`
        )
      }

      const json = await response.json()
      const data: NotificationResponse[] = json.data ?? []

      setNotifications(data)
      setTotal(data.length)
      setUnreadCount(data.filter((n: NotificationResponse) => !n.is_read).length)

      // Return profile_id from meta so the Realtime subscription can use it
      return (json.meta?.profile_id as string) ?? null
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Failed to load notifications")
      return null
    } finally {
      setIsLoading(false)
    }
  }, [unread_only])

  // ─── Mount: fetch + subscribe ────────────────────────────────────────────────

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const init = async () => {
      const profileId = await fetchNotifications()

      // Only subscribe if we have a valid profile ID (requirement 3.5)
      if (!profileId) return

      const supabase = createClient()
      const channel = supabase
        .channel(`portal_notifications:${profileId}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "portal_notifications",
            filter: `customer_id=eq.${profileId}`,
          },
          (payload) => {
            pushNotification(payload.new as NotificationResponse)
          }
        )
        .subscribe((status) => {
          // Requirement 3.6: subscription errors must NOT crash the hook
          if (status === "CHANNEL_ERROR") {
            console.error("Realtime subscription error on portal_notifications")
          }
        })

      // Requirement 3.7: cleanup on unmount
      cleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    init()

    return () => {
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread_only])

  // ─── refresh ─────────────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // ─── pushNotification ────────────────────────────────────────────────────────
  // Called by Realtime handler AND by external callers (e.g. usePortalRealtime).
  // Signature must remain unchanged (requirement 3.8 / 8.3).

  const pushNotification = useCallback((notif: NotificationResponse) => {
    setNotifications(prev => [notif, ...prev])
    setTotal(prev => prev + 1)
    if (!notif.is_read) {
      setUnreadCount(prev => prev + 1)
    }
  }, [])

  // ─── markRead ────────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    const prev = notificationsRef.current
    setNotifications(list => list.map(n => n.id === id ? { ...n, is_read: true } : n))
    const wasUnread = prev.some(n => n.id === id && !n.is_read)
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1))

    try {
      const response = await fetch(`/api/v1/portal/notifications/${id}/read`, {
        method: "PATCH",
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message ?? "Failed to mark notification as read")
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setNotifications(prev)
      if (wasUnread) setUnreadCount(c => c + 1)
      setError((err as Error)?.message ?? "Failed to mark notification as read")
    }
  }, [])

  // ─── markAllRead ─────────────────────────────────────────────────────────────

  const markAllRead = useCallback(async () => {
    // Optimistic update
    const prev = notificationsRef.current
    setNotifications(list => list.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      const response = await fetch("/api/v1/portal/notifications/read-all", {
        method: "POST",
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData?.error?.message ?? "Failed to mark all notifications as read")
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setNotifications(prev)
      setUnreadCount(prev.filter(n => !n.is_read).length)
      setError((err as Error)?.message ?? "Failed to mark all notifications as read")
    }
  }, [])

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    refresh,
    markRead,
    markAllRead,
    pushNotification,
  }
}
