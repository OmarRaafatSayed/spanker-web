"use client";

/**
 * NotificationDropdown
 * Bell icon with unread count badge.
 * Fetches /api/admin/notifications on click, marks read on item click.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/admin-store";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string | null;
}

function _getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("customer_portal_session");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { session?: { access_token?: string } };
    return parsed?.session?.access_token ?? "";
  } catch { return ""; }
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export function NotificationDropdown() {
  const [open, setOpen]               = useState(false);
  const [notifs, setNotifs]           = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(false);
  const dropRef                       = useRef<HTMLDivElement>(null);
  const unreadCount                   = useAdminStore(s => s.unreadNotifications);
  const setUnread                     = useAdminStore(s => s.setUnreadNotifications);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?limit=10", {
        headers: { Authorization: `Bearer ${_getToken()}` },
      });
      if (!res.ok) return;
      const json = await res.json() as { success: boolean; data: Notification[]; unread_count: number };
      if (json.success) {
        setNotifs(json.data);
        setUnread(json.unread_count);
      }
    } finally {
      setLoading(false);
    }
  }, [setUnread]);

  // Poll unread count every 60s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(Math.max(0, unreadCount - 1));
    await fetch(`/api/admin/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${_getToken()}` },
    }).catch(() => {});
  }

  function handleOpen() {
    setOpen(v => !v);
    if (!open) fetchNotifs();
  }

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-bg-alt transition text-text-secondary"
        aria-label="الإشعارات"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl border border-border-light shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary">الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-brand-green">
                {unreadCount} جديد
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border-light">
            {loading && notifs.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">جاري التحميل…</div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">لا توجد إشعارات</div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.action_url) window.location.href = n.action_url; }}
                  className={cn(
                    "px-4 py-3 cursor-pointer hover:bg-bg-alt transition-colors",
                    !n.is_read && "bg-brand-green/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!n.is_read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                    )}
                    <div className={cn("flex-1 min-w-0", n.is_read && "mr-[18px]")}>
                      <p className="text-xs font-semibold text-text-primary truncate">{n.title}</p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-text-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border-light">
            <a href="/admin/logs" className="text-xs text-brand-green font-semibold hover:underline">
              عرض كل السجلات ←
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
