'use client';

import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  travel_request_id?: string | null;
}

const typeIcons: Record<string, string> = {
  booking_confirmed:  '✅',
  booking_cancelled:  '❌',
  booking_expired:    '⏰',
  booking_assigned:   '👤',
  payment_confirmed:  '💰',
  document_approved:  '📄',
  document_rejected:  '⚠️',
  escalation:         '🚨',
  reminder:           '🔔',
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useRealtimeNotifications(userId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              وضع علامة مقروء للكل
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد إشعارات</p>
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={() => markAsRead(n.id)}
                typeIcon={typeIcons[n.type]}
              />
            ))}

            <DropdownMenuSeparator />

            <div className="p-2">
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full" size="sm">
                  عرض جميع الإشعارات
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  typeIcon,
}: {
  notification: Notification;
  onMarkRead: () => void;
  typeIcon?: string;
}) {
  const timeAgo = getTimeAgo(notification.created_at);

  const content = (
    <div
      className={`flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex-shrink-0 text-2xl">{typeIcon ?? '🔔'}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight">{notification.title}</p>
          {!notification.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMarkRead();
              }}
              className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
              title="وضع علامة مقروء"
            >
              <Check className="h-3 w-3 text-green-600" />
            </button>
          )}
        </div>

        <p className="text-xs text-text-muted mt-1 line-clamp-2">{notification.body ?? notification.title}</p>
        <p className="text-xs text-text-muted mt-1">{timeAgo}</p>
      </div>

      {!notification.is_read && (
        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
      )}
    </div>
  );

  if (notification.action_url) {
    return (
      <Link href={notification.action_url} onClick={onMarkRead}>
        {content}
      </Link>
    );
  }
  return content;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'الآن';
  if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
  if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
  if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
