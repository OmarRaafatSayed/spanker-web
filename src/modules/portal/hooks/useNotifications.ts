"use client"

import { useState, useCallback } from "react"
import { MOCK_NOTIFICATIONS } from "@/lib/mock/data"
import type { NotificationResponse } from "@/modules/portal/types/portal.types"

let _notifications = [...MOCK_NOTIFICATIONS]

export function useNotifications(unread_only = false) {
  const initial = unread_only
    ? _notifications.filter(n => !n.is_read)
    : _notifications

  const [notifications, setNotifications] = useState<NotificationResponse[]>(initial)
  const [total,         setTotal]         = useState(initial.length)
  const [unreadCount,   setUnreadCount]   = useState(_notifications.filter(n => !n.is_read).length)
  const [isLoading]                       = useState(false)
  const [error]                           = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const list = unread_only
      ? _notifications.filter(n => !n.is_read)
      : _notifications
    setNotifications(list)
    setTotal(list.length)
    setUnreadCount(_notifications.filter(n => !n.is_read).length)
  }, [unread_only])

  const markRead = useCallback(async (id: string) => {
    _notifications = _notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    _notifications = _notifications.map(n => ({ ...n, is_read: true }))
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [])

  const pushNotification = useCallback((notif: NotificationResponse) => {
    _notifications = [notif, ..._notifications]
    setNotifications(prev => [notif, ...prev])
    setTotal(prev => prev + 1)
    setUnreadCount(prev => prev + 1)
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
