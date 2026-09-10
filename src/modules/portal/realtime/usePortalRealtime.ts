"use client"

import { useEffect } from "react"
import { supabase }  from "@/lib/supabase/client"
import type { NotificationResponse, RequestResponse, DocumentResponse } from "@/modules/portal/types/portal.types"

interface RealtimeCallbacks {
  onNotification?:   (notif: NotificationResponse) => void
  onRequestUpdate?:  (req:   Partial<RequestResponse>) => void
  onDocumentUpdate?: (doc:   Partial<DocumentResponse>) => void
}

export function usePortalRealtime(userId: string, callbacks: RealtimeCallbacks) {
  useEffect(() => {
    if (!userId) return

    const channelName = `portal-live-${userId}`
    
    const existingChannel = supabase.getChannels().find(ch => ch.topic === `realtime:${channelName}`)
    if (existingChannel) {
      return () => {}
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "portal_notifications",
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => callbacks.onNotification?.(payload.new as NotificationResponse)
      )
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "customer_requests",
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => callbacks.onRequestUpdate?.(payload.new as Partial<RequestResponse>)
      )
      .on(
        "postgres_changes",
        {
          event:  "UPDATE",
          schema: "public",
          table:  "portal_documents",
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => callbacks.onDocumentUpdate?.(payload.new as Partial<DocumentResponse>)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, callbacks])
}