"use client"

// =============================================================================
// NotificationBell — header bell icon with unread badge + dropdown
// =============================================================================

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { NotificationResponse } from "@/modules/portal/types/portal.types"

const TYPE_ICONS: Record<string, string> = {
  status_update:        "📋",
  document_approved:    "✅",
  document_rejected:    "❌",
  payment_due:          "💳",
  payment_confirmed:    "🎉",
  message:              "💬",
  info:                 "ℹ️",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)    return "just now"
  if (mins < 60)   return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24)  return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface NotificationBellProps {
  notifications: NotificationResponse[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const recent = notifications.slice(0, 8)

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none min-w-[18px] px-0.5"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-brand-green hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              recent.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { onMarkRead(n.id); setOpen(false) }}
                  className={cn(
                    "w-full text-left px-4 py-3 flex gap-3 hover:bg-muted/50 transition-colors",
                    !n.is_read && "bg-brand-green/5"
                  )}
                >
                  <span className="text-lg shrink-0 mt-0.5" aria-hidden>
                    {TYPE_ICONS[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", !n.is_read && "font-semibold")}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-brand-green shrink-0" aria-hidden />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <Link
              href="/notifications"
              className="block text-center text-xs text-brand-green hover:underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
