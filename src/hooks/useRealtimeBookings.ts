import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TABLES } from '@/lib/db/schema';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeBookingsOptions {
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: {
    column?: string;
    value?: string;
  };
}

export function useRealtimeBookings(options: UseRealtimeBookingsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = () => {
      // Create channel name based on filter
      const channelName = options.filter
        ? `bookings:${options.filter.column}=${options.filter.value}`
        : 'bookings:all';

      channel = supabase.channel(channelName);

      // Build the filter for Postgres Changes
      const filterConfig = options.filter
        ? {
            event: '*' as const,
            schema: 'public',
            table: TABLES.travelRequests,
            filter: `${options.filter.column}=eq.${options.filter.value}`,
          }
        : {
            event: '*' as const,
            schema: 'public',
            table: TABLES.travelRequests,
          };

      channel
        .on('postgres_changes', filterConfig, (payload) => {
          console.log('Realtime update:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              options.onInsert?.(payload.new);
              break;
            case 'UPDATE':
              options.onUpdate?.(payload.new);
              break;
            case 'DELETE':
              options.onDelete?.(payload.old);
              break;
          }
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [options.filter?.column, options.filter?.value]);

  return { isConnected };
}
