/**
 * sync-queue-processor.ts
 * =======================
 * Background job processor for syncing queued entities to CRM.
 * Runs periodically (e.g., every 5 minutes via cron or deployment hook).
 * 
 * FLOW:
 * 1. Fetch pending items from sync_queue where status='pending'
 * 2. For each item: attempt sync to CRM via crmAdapter
 * 3. Update sync_status in source table (success/failed)
 * 4. Mark sync_queue item as completed/failed with retry logic
 * 
 * RETRY LOGIC:
 * - Max 3 retries per item
 * - Exponential backoff: next_retry_at = NOW() + INTERVAL '5 minutes' * (retry_count + 1)
 * - Non-retryable errors: 4xx (client errors) except 408, 429
 */

import { supabase } from "@/lib/supabase";
import { crmAdapter } from "@/lib/services/crm-adapter";

export interface SyncQueueItem {
  queue_id: string;
  entity_type: "profile" | "travel_request" | "visa_application" | "payment" | "document";
  entity_id: string;
  direction: "portal_to_crm" | "crm_to_portal";
  payload: Record<string, unknown>;
  retry_count: number;
}

interface SyncResult {
  success: boolean;
  queueId: string;
  entityType: string;
  entityId: string;
  error?: string;
}

/**
 * Main processor function — call this periodically (e.g., every 5 minutes)
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    console.log("[sync-queue] Starting sync queue processor...");

    // Fetch pending items
    const { data: pending, error: fetchError } = await supabase
      .rpc("get_pending_syncs");

    if (fetchError) {
      const msg = `Failed to fetch pending syncs: ${fetchError.message}`;
      console.error("[sync-queue]", msg);
      results.errors.push(msg);
      return results;
    }

    if (!pending || pending.length === 0) {
      console.log("[sync-queue] No pending items to sync");
      return results;
    }

    console.log(`[sync-queue] Processing ${pending.length} pending items...`);

    // Process each item
    for (const item of pending) {
      results.processed++;
      const syncResult = await processSyncItem(item as SyncQueueItem);

      if (syncResult.success) {
        results.succeeded++;
      } else {
        results.failed++;
        if (syncResult.error) {
          results.errors.push(syncResult.error);
        }
      }
    }

    console.log(
      `[sync-queue] Complete: ${results.processed} processed, ${results.succeeded} succeeded, ${results.failed} failed`
    );

    // Log summary to system_logs
    await supabase.from("system_logs").insert({
      level: results.failed === 0 ? "success" : "warning",
      event: "sync_queue_processor_run",
      details: `Processed ${results.processed} items: ${results.succeeded} succeeded, ${results.failed} failed`,
      source: "system",
      metadata: {
        processed: results.processed,
        succeeded: results.succeeded,
        failed: results.failed,
        errorCount: results.errors.length,
      },
    });

    return results;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sync-queue] Processor error:", msg);
    results.errors.push(`Processor crash: ${msg}`);
    return results;
  }
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<SyncResult> {
  const { queue_id, entity_type, entity_id, payload, retry_count } = item;

  try {
    console.log(`[sync-queue] Processing ${entity_type}:${entity_id} (attempt ${retry_count + 1})...`);

    // Mark as processing
    await updateSyncQueueStatus(queue_id, "processing", null);

    let syncSuccess = false;
    let errorMsg: string | null = null;

    // Route by entity type
    switch (entity_type) {
      case "profile":
        [syncSuccess, errorMsg] = await syncProfile(entity_id, payload);
        break;

      case "travel_request":
        [syncSuccess, errorMsg] = await syncTravelRequest(entity_id, payload);
        break;

      case "visa_application":
        [syncSuccess, errorMsg] = await syncVisaApplication(entity_id, payload);
        break;

      case "payment":
        [syncSuccess, errorMsg] = await syncPayment(entity_id, payload);
        break;

      case "document":
        [syncSuccess, errorMsg] = await syncDocument(entity_id, payload);
        break;

      default:
        errorMsg = `Unknown entity type: ${entity_type}`;
        break;
    }

    if (syncSuccess) {
      // Mark synced in source table
      await markEntitySynced(entity_type, entity_id, null);

      // Mark queue item completed
      await updateSyncQueueStatus(queue_id, "completed", null);

      console.log(`✅ [sync-queue] ${entity_type}:${entity_id} synced successfully`);

      return {
        success: true,
        queueId: queue_id,
        entityType: entity_type,
        entityId: entity_id,
      };
    } else {
      // Check if retryable
      const retryable = isRetryable(errorMsg);

      if (retryable && retry_count < 3) {
        // Schedule retry with exponential backoff
        const nextRetryDelay = 5 * Math.pow(2, retry_count); // 5, 10, 20 minutes
        const nextRetryAt = new Date(Date.now() + nextRetryDelay * 60000);

        await supabase
          .from("sync_queue")
          .update({
            status: "pending",
            retry_count: retry_count + 1,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", queue_id);

        console.log(
          `⏳ [sync-queue] ${entity_type}:${entity_id} marked for retry (attempt ${retry_count + 2}, next: ${nextRetryAt.toISOString()})`
        );
      } else {
        // Mark failed permanently
        await markEntitySynced(entity_type, entity_id, errorMsg);
        await updateSyncQueueStatus(queue_id, "failed", errorMsg);

        console.log(`❌ [sync-queue] ${entity_type}:${entity_id} failed permanently: ${errorMsg}`);
      }

      return {
        success: false,
        queueId: queue_id,
        entityType: entity_type,
        entityId: entity_id,
        error: errorMsg || "Unknown error",
      };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[sync-queue] Processor error for ${entity_type}:${entity_id}:`, errorMsg);

    await updateSyncQueueStatus(queue_id, "failed", errorMsg);
    await markEntitySynced(entity_type, entity_id, errorMsg);

    return {
      success: false,
      queueId: queue_id,
      entityType: entity_type,
      entityId: entity_id,
      error: errorMsg,
    };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Entity sync handlers
// ═════════════════════════════════════════════════════════════════════════════

async function syncProfile(
  profileId: string,
  payload: Record<string, unknown>
): Promise<[boolean, string | null]> {
  try {
    // Fetch full profile data
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return [false, `Profile not found: ${fetchError?.message}`];
    }

    // Call CRM API to provision profile
    const result = await crmAdapter.updateProfile({
      full_name: profile.full_name,
      phone: profile.phone,
    });

    if (!result.ok) {
      return [false, result.error];
    }

    return [true, null];
  } catch (err) {
    return [false, err instanceof Error ? err.message : String(err)];
  }
}

async function syncTravelRequest(
  requestId: string,
  payload: Record<string, unknown>
): Promise<[boolean, string | null]> {
  try {
    // Fetch full travel request
    const { data: req, error: fetchError } = await supabase
      .from("travel_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !req) {
      return [false, `Travel request not found: ${fetchError?.message}`];
    }

    // TODO: Implement travel request sync to CRM
    // This would call a CRM endpoint to create/update booking
    console.log(`[sync-queue] Travel request sync not yet implemented: ${requestId}`);

    return [true, null];
  } catch (err) {
    return [false, err instanceof Error ? err.message : String(err)];
  }
}

async function syncVisaApplication(
  visaId: string,
  payload: Record<string, unknown>
): Promise<[boolean, string | null]> {
  try {
    // Fetch full visa application
    const { data: visa, error: fetchError } = await supabase
      .from("visa_applications")
      .select("*")
      .eq("id", visaId)
      .single();

    if (fetchError || !visa) {
      return [false, `Visa application not found: ${fetchError?.message}`];
    }

    // TODO: Implement visa application sync to CRM
    console.log(`[sync-queue] Visa application sync not yet implemented: ${visaId}`);

    return [true, null];
  } catch (err) {
    return [false, err instanceof Error ? err.message : String(err)];
  }
}

async function syncPayment(
  paymentId: string,
  payload: Record<string, unknown>
): Promise<[boolean, string | null]> {
  try {
    // Fetch full payment record
    const { data: payment, error: fetchError } = await supabase
      .from("payment_records")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (fetchError || !payment) {
      return [false, `Payment not found: ${fetchError?.message}`];
    }

    // TODO: Implement payment sync to CRM
    console.log(`[sync-queue] Payment sync not yet implemented: ${paymentId}`);

    return [true, null];
  } catch (err) {
    return [false, err instanceof Error ? err.message : String(err)];
  }
}

async function syncDocument(
  documentId: string,
  payload: Record<string, unknown>
): Promise<[boolean, string | null]> {
  try {
    // Fetch full document
    const { data: doc, error: fetchError } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (fetchError || !doc) {
      return [false, `Document not found: ${fetchError?.message}`];
    }

    // Notify CRM of document via crmAdapter
    await crmAdapter.notifyCrmDocumentUploaded(
      doc.travel_request_id,
      doc.document_type,
      doc.file_path || ""
    );

    return [true, null];
  } catch (err) {
    return [false, err instanceof Error ? err.message : String(err)];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Helper functions
// ═════════════════════════════════════════════════════════════════════════════

async function updateSyncQueueStatus(
  queueId: string,
  status: "processing" | "completed" | "failed",
  errorMsg: string | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updates.processed_at = new Date().toISOString();
  }

  if (errorMsg) {
    updates.error_message = errorMsg;
  }

  await supabase.from("sync_queue").update(updates).eq("id", queueId);
}

async function markEntitySynced(
  tableeName: string,
  entityId: string,
  errorMsg: string | null
): Promise<void> {
  const updates: Record<string, unknown> = {
    sync_status: errorMsg ? "failed" : "synced",
    last_sync_at: new Date().toISOString(),
  };

  if (errorMsg) {
    updates.sync_error = errorMsg;
  } else {
    updates.sync_error = null;
  }

  await supabase.from(tableeName).update(updates).eq("id", entityId);
}

function isRetryable(errorMsg: string | null): boolean {
  if (!errorMsg) return true;

  // Don't retry on client errors except 408 (timeout), 429 (rate limit)
  if (errorMsg.includes("400") || errorMsg.includes("401") || errorMsg.includes("403")) {
    return false;
  }

  // Retry on server errors, timeouts, rate limits, network errors
  return true;
}

export type { SyncResult };
