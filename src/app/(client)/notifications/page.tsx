"use client"

// =============================================================================
// /notifications — full notifications list
// =============================================================================

import { useNotifications }  from "@/modules/portal/hooks/useNotifications"
import { usePortalRealtime } from "@/modules/portal/realtime/usePortalRealtime"
import { useAuthStore }      from "@/modules/auth/store/authStore"
import { LoadingSpinner }    from "@/components/common/LoadingSpinner"
import { Button }            from "@/components/ui/button"
import { cn }                from "@/lib/utils"
import { Bell, AlertCircle, CheckCheck } from "lucide-react"

const TYPE_ICONS: Record<string, string> = {
  status_update:     "📋",
  document_approved: "✅",
  document_rejected: "❌",
  payment_due:       "💳",
  payment_confirmed: "🎉",
  message:           "💬",
  info:              "ℹ️",
}

function timeAgo(dateStr: string) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(dateStr).toLocaleDateString("en-EG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const {
    notifications, unreadCount, isLoading, error,
    refresh, markRead, markAllRead, pushNotification,
  } = useNotifications()

  // Live updates
  usePortalRealtime(user?.id ?? "", { onNotification: pushNotification })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={refresh}>Retry</Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {notifications.map(n => (
            <button
              key={n.id}
              type="button"
              onClick={() => !n.is_read && markRead(n.id)}
              className={cn(
                "w-full text-left flex gap-4 px-5 py-4 hover:bg-muted/40 transition-colors",
                !n.is_read && "bg-brand-green/5"
              )}
            >
              {/* Icon */}
              <span className="text-xl shrink-0 mt-0.5" aria-hidden>
                {TYPE_ICONS[n.type] ?? "🔔"}
              </span>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !n.is_read ? "font-semibold" : "font-medium")}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-3">{n.body}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">{timeAgo(n.created_at)}</p>
              </div>

              {/* Unread dot */}
              {!n.is_read && (
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-green shrink-0" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
