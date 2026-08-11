/**
 * realtime-subscriptions.ts
 * =========================
 * Fault-tolerant Supabase Realtime subscription manager.
 *
 * PROBLEMS SOLVED:
 *   1. The old realtimeApi in api.ts had no reconnect logic — a dropped
 *      connection silently stopped delivering updates.
 *   2. Subscription callbacks directly mutated component state, creating
 *      tight coupling between Supabase and the UI.
 *   3. No Zustand store invalidation on incoming changes.
 *
 * SOLUTION:
 *   - Exponential-backoff reconnect loop per channel.
 *   - All updates are pushed into Zustand stores, not component state.
 *   - A registry prevents duplicate channel subscriptions.
 *   - Clean unsubscribe() handles component unmount safely.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useTravelRequestsStore } from "@/lib/store";
import type { TravelRequest } from "@/types";
import type { CustomerDocument } from "@/types";

// =============================================================================
// Internal channel registry (prevents duplicate subscriptions)
// =============================================================================

const _channelRegistry = new Map<string, RealtimeChannel>();

function getOrCreateChannel(name: string): RealtimeChannel {
  if (_channelRegistry.has(name)) {
    return _channelRegistry.get(name)!;
  }
  const channel = supabase.channel(name);
  _channelRegistry.set(name, channel);
  return channel;
}

function removeChannel(name: string): void {
  const ch = _channelRegistry.get(name);
  if (ch) {
    supabase.removeChannel(ch).catch(() => {});
    _channelRegistry.delete(name);
  }
}

// =============================================================================
// Reconnect helper — exponential backoff
// =============================================================================

interface SubscribeOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

async function subscribeWithRetry(
  channel: RealtimeChannel,
  options: SubscribeOptions = {}
): Promise<void> {
  const { maxRetries = 5, baseDelayMs = 1000 } = options;

  let attempt = 0;

  const trySubscribe = () => {
    channel.subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        attempt = 0; // reset on success
        return;
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        attempt++;
        if (attempt > maxRetries) {
          console.error(
            `[realtime] Channel "${channel.topic}" failed after ${maxRetries} retries.`,
            err
          );
          return;
        }

        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[realtime] Channel "${channel.topic}" ${status}. Retry ${attempt}/${maxRetries} in ${delay}ms`
        );

        setTimeout(() => {
          // Unsubscribe, then re-subscribe
          channel.unsubscribe().then(trySubscribe).catch(() => trySubscribe());
        }, delay);
      }
    });
  };

  trySubscribe();
}

// =============================================================================
// Public subscription API
// =============================================================================

export const realtimeSubscriptions = {

  /**
   * Subscribe to changes on a single travel_request row.
   * On update: patches the Zustand store and invokes the optional callback.
   *
   * @returns unsubscribe function — call on component unmount
   */
  subscribeToTravelRequest(
    requestId: string,
    onUpdate?: (request: TravelRequest) => void
  ): () => void {
    const channelName = `travel_request:${requestId}`;
    removeChannel(channelName); // ensure no stale channel

    const channel = getOrCreateChannel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "travel_requests",
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          const updated = payload.new as TravelRequest;

          // 1. Push into Zustand — all components reading the store update automatically
          useTravelRequestsStore.getState().updateRequest(updated.id, updated);

          // 2. Optional direct callback (for local component state or navigation)
          onUpdate?.(updated);
        }
      );

    subscribeWithRetry(channel);

    return () => removeChannel(channelName);
  },

  /**
   * Subscribe to all travel_request changes for the current user.
   * Invalidates the full requests list in the Zustand store.
   *
   * @returns unsubscribe function
   */
  subscribeToMyTravelRequests(
    clientUserId: string,
    onInvalidate?: () => void
  ): () => void {
    const channelName = `my_travel_requests:${clientUserId}`;
    removeChannel(channelName);

    const channel = getOrCreateChannel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "travel_requests",
          filter: `client_user_id=eq.${clientUserId}`,
        },
        (payload) => {
          const store = useTravelRequestsStore.getState();

          if (payload.eventType === "INSERT") {
            store.addRequest(payload.new as TravelRequest);
          } else if (payload.eventType === "UPDATE") {
            store.updateRequest(
              (payload.new as TravelRequest).id,
              payload.new as TravelRequest
            );
          } else if (payload.eventType === "DELETE") {
            store.removeRequest((payload.old as { id: string }).id);
          }

          onInvalidate?.();
        }
      );

    subscribeWithRetry(channel);

    return () => removeChannel(channelName);
  },

  /**
   * Subscribe to document status changes for a travel request.
   * Refreshes all documents from Supabase on any change, then invokes callback.
   *
   * @returns unsubscribe function
   */
  subscribeToDocuments(
    requestId: string,
    onDocumentsUpdated: (documents: CustomerDocument[]) => void
  ): () => void {
    const channelName = `documents:${requestId}`;
    removeChannel(channelName);

    const channel = getOrCreateChannel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_documents",
          filter: `travel_request_id=eq.${requestId}`,
        },
        async () => {
          // Re-fetch full list to get accurate status after any change
          try {
            const { data, error } = await supabase
              .from("customer_documents")
              .select("*")
              .eq("travel_request_id", requestId)
              .order("created_at", { ascending: false });

            if (!error && data) {
              onDocumentsUpdated(data as CustomerDocument[]);
            }
          } catch (err) {
            console.error("[realtime] Failed to refresh documents:", err);
          }
        }
      );

    subscribeWithRetry(channel);

    return () => removeChannel(channelName);
  },

  /**
   * Tear down ALL active channels — call on logout or app unmount.
   */
  unsubscribeAll(): void {
    for (const [name] of _channelRegistry) {
      removeChannel(name);
    }
  },
};
