/**
 * GET /api/sync
 * =============
 * Trigger the sync queue processor manually.
 * 
 * AUTHENTICATION:
 * - Requires X-Sync-Key header matching SYNC_PROCESSOR_SECRET
 * - This prevents unauthorized triggering of background jobs
 * 
 * USAGE (from cron or deployment hook):
 * - curl -X GET https://yourdomain.com/api/sync -H "X-Sync-Key: secret"
 * 
 * RESPONSE:
 * - 200 OK: { processed, succeeded, failed, errors }
 * - 401 Unauthorized: Invalid or missing X-Sync-Key
 * - 500 Server Error: Processor crashed
 */

import { processSyncQueue } from "@/lib/services/sync-queue-processor";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Ensure this runs on Node.js (not Edge)
export const dynamic = "force-dynamic"; // Always run fresh, don't cache

/**
 * POST /api/sync — Start sync queue processor
 */
export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    const syncKey = request.headers.get("X-Sync-Key") || authHeader?.replace("Bearer ", "");

    const expectedKey = process.env.SYNC_PROCESSOR_SECRET;

    if (!expectedKey || syncKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing X-Sync-Key" },
        { status: 401 }
      );
    }

    // Run processor
    const result = await processSyncQueue();

    // Return result
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/sync] Error:", message);

    return NextResponse.json(
      { error: "Processor error", details: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync — Health check (no processing)
 */
export async function GET(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    const syncKey = request.headers.get("X-Sync-Key") || authHeader?.replace("Bearer ", "");

    const expectedKey = process.env.SYNC_PROCESSOR_SECRET;

    if (!expectedKey || syncKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing X-Sync-Key" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { status: "ready", message: "Sync processor API is ready. Use POST to trigger." },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Health check error", details: message },
      { status: 500 }
    );
  }
}
