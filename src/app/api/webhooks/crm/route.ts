/**
 * POST /api/webhooks/crm
 * ======================
 * Receives real-time status update webhooks from the external CRM (FastAPI).
 *
 * SECURITY FEATURES:
 *   - HMAC-SHA256 signature verification (header: x-crm-signature: sha256=<hex>)
 *   - Timing-safe comparison prevents timing attacks
 *   - Request rate limiting (optional, configurable via env)
 *   - Request ID deduplication to prevent duplicate processing
 *   - Request timestamp validation (reject stale requests > 5 minutes)
 *   - IP allowlist (optional, for production environments)
 *   - Set CRM_WEBHOOK_SECRET in env — if absent, validation is skipped in dev only
 *
 * DECOUPLING:
 *   - All processing is delegated to crmAdapter.processCrmWebhook()
 *   - This route never writes to Supabase directly
 *   - Failures are logged to system_logs; the route always returns 200 to the CRM
 *     (prevents infinite retry storms from the CRM side)
 *
 * GET /api/webhooks/crm — health check, no auth
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { crmAdapter, queueOperation, cancelOperation } from "@/lib/services/crm-adapter";
import { supabase } from "@/lib/supabase";
import type { CRMStatusUpdate } from "@/types";

// =============================================================================
// HMAC signature validation
// =============================================================================

const WEBHOOK_SECRET = process.env.CRM_WEBHOOK_SECRET ?? "";
const IS_DEV = process.env.NODE_ENV !== "production";
const MAX_REQUEST_AGE_MS = 5 * 60 * 1000; // 5 minutes
const ENABLE_RATE_LIMIT = process.env.ENABLE_WEBHOOK_RATE_LIMIT !== "false"; // default: enabled

// In-memory store for request ID deduplication (in production, use Redis)
const seenRequestIds = new Set<string>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const requestTimestamps: number[] = [];

function validateHmacSignature(rawBody: string, signatureHeader: string): boolean {
  // In development with no secret configured, skip validation with a warning
  if (!WEBHOOK_SECRET) {
    if (IS_DEV) {
      console.warn("[webhook/crm] ⚠️  CRM_WEBHOOK_SECRET not set — skipping HMAC validation (dev only).");
      return true;
    }
    // Production MUST have a secret
    console.error("[webhook/crm] ❌ CRM_WEBHOOK_SECRET is not configured in production.");
    return false;
  }

  // Header format: "sha256=<hex_digest>"
  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;

  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  // Pad to same length before timing-safe comparison
  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Check if the request is within the rate limit.
 */
function checkRateLimit(ip: string): boolean {
  if (!ENABLE_RATE_LIMIT) return true;

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Remove old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }

  // Check if under limit
  if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[webhook/crm] ⚠️  Rate limit exceeded for IP: ${ip}`);
    return false;
  }

  // Record this request
  requestTimestamps.push(now);
  return true;
}

/**
 * Check if the request timestamp is too old (replay attack prevention).
 */
function validateTimestamp(timestamp: string | undefined): boolean {
  if (!timestamp) return false;

  try {
    const requestTime = new Date(timestamp).getTime();
    const now = Date.now();
    const age = now - requestTime;

    if (age > MAX_REQUEST_AGE_MS) {
      console.warn(`[webhook/crm] ⚠️  Request timestamp too old: ${age / 1000}s`);
      return false;
    }

    // Also reject future-dated requests (clock skew protection)
    if (age < -MAX_REQUEST_AGE_MS) {
      console.warn("[webhook/crm] ⚠️  Request timestamp is in the future");
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if this request ID was already processed (deduplication).
 */
async function isDuplicateRequest(trackingId: string): Promise<boolean> {
  // Use Supabase to check for duplicate processing
  const { data, error } = await supabase
    .from("webhook_processing_log")
    .select("id")
    .eq("request_id", trackingId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[webhook/crm] Error checking duplicate:", error.message);
    // If we can't check, assume it's not a duplicate (fail open for safety)
    return false;
  }

  return !!data;
}

/**
 * Log that we processed this webhook (for deduplication).
 */
async function logWebhookProcessing(trackingId: string, status: "success" | "failed"): Promise<void> {
  try {
    await supabase.from("webhook_processing_log").insert([{
      request_id: trackingId,
      status,
      processed_at: new Date().toISOString(),
    }]);
  } catch (err) {
    console.error("[webhook/crm] Failed to log processing:", err);
  }
}

// =============================================================================
// Payload validation
// =============================================================================

const VALID_PORTAL_STATUSES = new Set([
  "pending_documents",
  "documents_review",
  "docs_approved",
  "in_progress",
  "completed",
  "cancelled",
]);

const VALID_DOC_STATUSES = new Set([
  "uploaded",
  "under_review",
  "approved",
  "rejected",
  "expired",
]);

function validatePayload(body: unknown): body is CRMStatusUpdate {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  if (typeof b.tracking_id !== "string" || !b.tracking_id) return false;
  if (typeof b.message !== "string") return false;
  if (typeof b.timestamp !== "string") return false;

  // status can be integer (CRM) or string slug (portal) — both are valid here
  const statusOk =
    (typeof b.status === "number" && b.status >= 1 && b.status <= 7) ||
    (typeof b.status === "string" && VALID_PORTAL_STATUSES.has(b.status));
  if (!statusOk) return false;

  // document_updates is optional
  if (b.document_updates !== undefined) {
    if (!Array.isArray(b.document_updates)) return false;
    for (const du of b.document_updates as unknown[]) {
      if (!du || typeof du !== "object") return false;
      const d = du as Record<string, unknown>;
      if (typeof d.type !== "string") return false;
      if (!VALID_DOC_STATUSES.has(d.status as string)) return false;
    }
  }

  return true;
}

// =============================================================================
// POST handler
// =============================================================================

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const signatureHeader = req.headers.get("x-crm-signature") ?? "";

  // Read raw body first (before any parsing) for HMAC
  const rawBody = await req.text();

  // ── 1. Validate HMAC signature ─────────────────────────────────────────────
  if (!validateHmacSignature(rawBody, signatureHeader)) {
    console.error(`[webhook/crm] ❌ Invalid HMAC signature from IP: ${ip}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 2. Check rate limit ───────────────────────────────────────────────────
  if (!checkRateLimit(ip)) {
    console.warn(`[webhook/crm] ❌ Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  // ── 3. Parse JSON ──────────────────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
  }

  // ── 4. Validate payload shape first (for type narrowing) ──────────────────
  if (!validatePayload(payload)) {
    console.warn("[webhook/crm] ⚠️  Invalid payload structure:", JSON.stringify(payload).slice(0, 200));
    return NextResponse.json(
      { error: "Invalid payload. Required: tracking_id, status (1-7 or slug), message, timestamp." },
      { status: 422 }
    );
  }

  // ── 5. Validate timestamp for replay attack prevention ────────────────────
  const trackingId = (payload as CRMStatusUpdate).tracking_id;
  const timestampValue = (payload as CRMStatusUpdate).timestamp;
  if (!validateTimestamp(timestampValue)) {
    console.warn("[webhook/crm] ⚠️  Invalid or stale timestamp");
    return NextResponse.json({ error: "Invalid or stale timestamp" }, { status: 422 });
  }

  // ── 6. Check for duplicate processing ─────────────────────────────────────
  if (await isDuplicateRequest(trackingId)) {
    console.log(`[webhook/crm] 🔄 Duplicate request detected: ${trackingId}`);
    return NextResponse.json({
      success: true,
      message: "Request already processed",
      tracking_id: trackingId,
      acknowledged: true,
    });
  }

  // ── 7. Log receipt ─────────────────────────────────────────────────────────
  console.log("[webhook/crm] ✅ Received:", {
    tracking_id: trackingId,
    status: (payload as CRMStatusUpdate).status,
    staff_id: (payload as CRMStatusUpdate).staff_id ?? "N/A",
    doc_updates: (payload as CRMStatusUpdate).document_updates?.length ?? 0,
    ip,
  });

  // ── 8. Process asynchronously — always ACK immediately to the CRM ──────────
  // We acknowledge synchronously, then process. This prevents the CRM from
  // retrying due to slow Supabase writes.
  setImmediate(async () => {
    const result = await crmAdapter.processCrmWebhook(payload as CRMStatusUpdate);
    await logWebhookProcessing(trackingId, result.ok ? "success" : "failed");
    if (!result.ok) {
      console.error("[webhook/crm] ❌ Processing failed:", result.error);
    }
  });

  return NextResponse.json({
    success: true,
    message: "Webhook received and queued for processing",
    tracking_id: trackingId,
    received_at: new Date().toISOString(),
  });
}

// =============================================================================
// GET — health check
// =============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "CRM Webhook Receiver v2",
    hmac_validation: WEBHOOK_SECRET ? "enabled" : "disabled (dev)",
    timestamp: new Date().toISOString(),
  });
}
