"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import type { NotificationResponse } from "@/modules/portal/types/portal.types"

export function useNotifications(unread_only = false) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      let query = supabase
        .from("portal_notifications")
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (unread_only) {
        query = query.eq("is_read", false)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const allNotifications = data || []
      setNotifications(allNotifications)
      setTotal(allNotifications.length)
      setUnreadCount(allNotifications.filter(n => !n.is_read).length)
    } catch (err: any) {
      setError(err?.message || "فشل تحميل الإشعارات")
    } finally {
      setIsLoading(false)
    }
  }, [unread_only])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    try {
      await supabase
        .from("portal_notifications")
        .update({ is_read: true })
        .eq("id", id)

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from("portal_notifications")
        .update({ is_read: true })
        .eq("customer_id", user.id)
        .eq("is_read", false)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }, [])

  const pushNotification = useCallback((notif: NotificationResponse) => {
    setNotifications(prev => [notif, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
    pushNotification,
  }
}