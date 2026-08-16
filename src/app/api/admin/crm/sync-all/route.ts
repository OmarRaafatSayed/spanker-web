/**
 * POST /api/admin/crm/sync-all
 * Trigger a full re-sync of all unsynced leads to CRM.
 * Queues via the existing /api/sync endpoint (SYNC_PROCESSOR_SECRET secured).
 * Returns a job summary.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const supabase = getServiceClient();

  // Count unsynced leads
  const { count: unsyncedCount } = await supabase
    .from("travel_requests")
    .select("*", { count: "exact", head: true })
    .in("sync_status", ["pending", "failed"]);

  // Fire the sync queue processor via internal call
  const syncSecret = process.env.SYNC_PROCESSOR_SECRET;
  let syncResult: Record<string, unknown> = { queued: true };
  let syncError: string | null = null;

  if (syncSecret) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL
          ? req.nextUrl.origin          // use same origin in serverless
          : "http://localhost:3000";

      const res = await fetch(`${baseUrl}/api/sync`, {
        method:  "POST",
        headers: { "X-Sync-Key": syncSecret },
        signal:  AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        syncResult = (await res.json()) as Record<string, unknown>;
      } else {
        syncError = `Sync API responded ${res.status}`;
      }
    } catch (err) {
      syncError = err instanceof Error ? err.message : String(err);
    }
  } else {
    syncError = "SYNC_PROCESSOR_SECRET is not configured";
  }

  const jobId = `sync_${Date.now()}_${auth.userId.slice(0, 8)}`;

  await logToSystemLogs(
    syncError ? "warning" : "success",
    "crm_sync_all_triggered",
    syncError
      ? `Sync-all triggered but failed: ${syncError}`
      : `Sync-all triggered by admin. Unsynced: ${unsyncedCount ?? 0}`,
    "crm",
    {
      job_id:         jobId,
      unsynced_count: unsyncedCount ?? 0,
      triggered_by:   auth.userId,
      sync_error:     syncError,
    }
  );

  return NextResponse.json({
    success: !syncError,
    data: {
      job_id:         jobId,
      unsynced_count: unsyncedCount ?? 0,
      sync_result:    syncResult,
      error:          syncError,
      triggered_at:   new Date().toISOString(),
    },
  });
}
