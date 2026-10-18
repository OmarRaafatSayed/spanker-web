import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TABLES } from '@/lib/db/schema';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Notification {
  id: string;
  customer_id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  travel_request_id?: string | null;
}

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    const fetchInitial = async () => {
      // First resolve auth.users.id → profiles.id (customer_id)
      const { data: profile } = await supabase
        .from(TABLES.profiles)
        .select('id')
        .eq('user_id', userId)
        .single();

      const customerId = profile?.id ?? userId;

      const { data, error } = await supabase
        .from(TABLES.portalNotifications)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }

      // Subscribe to real-time changes for this customer
      channel = supabase.channel(`notifications:${customerId}`);
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLES.portalNotifications,
            filter: `customer_id=eq.${customerId}`,
          },
          (payload) => {
            switch (payload.eventType) {
              case 'INSERT':
                setNotifications((prev) => [payload.new as Notification, ...prev]);
                if (!(payload.new as Notification).is_read)
                  setUnreadCount((c) => c + 1);
                break;
              case 'UPDATE':
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? (payload.new as Notification) : n
                  )
                );
                setUnreadCount((prev) =>
                  Math.max(0, (payload.new as Notification).is_read ? prev - 1 : prev)
                );
                break;
              case 'DELETE':
                setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                if (!(payload.old as Notification).is_read)
                  setUnreadCount((c) => Math.max(0, c - 1));
                break;
            }
          }
        )
        .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    };

    fetchInitial();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from(TABLES.portalNotifications)
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const markAllAsRead = async () => {
    // Fire and forget — real-time subscription will sync state
    await fetch('/api/v1/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    });
  };

  return { notifications, unreadCount, isConnected, markAsRead, markAllAsRead };
}
