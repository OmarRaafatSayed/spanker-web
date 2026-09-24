"use client"

/**
 * MOCK — no-op realtime hook.
 * Supabase realtime channels are disabled in frontend-only mode.
 * The interface is identical so all call sites compile without changes.
 */

import type {
  NotificationResponse,
  RequestResponse,
  DocumentResponse,
} from "@/modules/portal/types/portal.types"

interface RealtimeCallbacks {
  onNotification?:   (notif: NotificationResponse) => void
  onRequestUpdate?:  (req:   Partial<RequestResponse>) => void
  onDocumentUpdate?: (doc:   Partial<DocumentResponse>) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePortalRealtime(_userId: string, _callbacks: RealtimeCallbacks) {
  // No-op: realtime disabled in mock mode
}
