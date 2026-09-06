/**
 * POST /api/webhooks/crm
 * ======================
 * Receives status-update webhooks from the FastAPI CRM backend.
 * Writes a portal_notification + portal_status_log row into Supabase
 * so the customer sees real-time updates in their portal.
 *
 * Security: HMAC-SHA256 signature verified against CRM_WEBHOOK_SECRET.
 * Idempotency: tracking_id checked in webhook_processing_log.
 */

import { NextResponse }  from "next/server"
import { createClient }  from "@supabase/supabase-js"
import { createHmac, timingSafeEqual } from "crypto"

// ── Supabase service-role client (server-side only) ────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ── Types ─────────────────────────────────────────────────────────────────
interface CRMWebhookPayload {
  tracking_id:    string          // idempotency key
  customer_id:    string          // auth.users.id
  request_id?:    string          // travel_requests.id (optional)
  event_type:     string          // "status_update" | "document_approved" | etc.
  title:          string
  body?:          string
  from_status?:   string
  to_status?:     string
  data?:          Record<string, unknown>
  timestamp?:     string
}

// ── HMAC verification ─────────────────────────────────────────────────────
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.CRM_WEBHOOK_SECRET
  if (!secret || !signature) return false
  try {
    const expected = createHmac("sha256", secret).update(body).digest("hex")
    const sigBuf   = Buffer.from(signature.replace("sha256=", ""), "hex")
    const expBuf   = Buffer.from(expected, "hex")
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

// ── Idempotency check ──────────────────────────────────────────────────────
async function isDuplicate(trackingId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_processing_log")
    .select("id")
    .eq("request_id", trackingId)
    .maybeSingle()
  return !!data
}

async function markProcessed(trackingId: string, status: "success" | "failed") {
  await supabase
    .from("webhook_processing_log")
    .insert({ request_id: trackingId, status })
}

// ── Map event_type → notification type ────────────────────────────────────
const EVENT_TO_NOTIF_TYPE: Record<string, string> = {
  status_update:        "status_update",
  document_approved:    "document_approved",
  document_rejected:    "document_rejected",
  payment_due:          "payment_due",
  payment_confirmed:    "payment_confirmed",
  message:              "message",
}

// ── POST handler ──────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const rawBody = await request.text()

  // 1. Verify HMAC signature
  const sig = request.headers.get("x-crm-signature") ??
              request.headers.get("x-hub-signature-256")

  if (!verifySignature(rawBody, sig)) {
    console.warn("[webhook/crm] Invalid signature")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Parse payload
  let payload: CRMWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { tracking_id, customer_id, request_id, event_type, title, body,
          from_status, to_status, data } = payload

  if (!tracking_id || !customer_id || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // 3. Idempotency — skip duplicates silently
  if (await isDuplicate(tracking_id)) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  try {
    // 4. Insert portal_notification
    const notifType = EVENT_TO_NOTIF_TYPE[event_type] ?? "info"

    const { error: notifErr } = await supabase
      .from("portal_notifications")
      .insert({
        customer_id,
        travel_request_id: request_id ?? null,
        title,
        body:  body ?? null,
        type:  notifType,
        data:  data ?? null,
      })

    if (notifErr) throw new Error(`notification insert: ${notifErr.message}`)

    // 5. Insert portal_status_log (only when there's a status transition)
    if (to_status && request_id) {
      const { error: logErr } = await supabase
        .from("portal_status_log")
        .insert({
          travel_request_id: request_id,
          request_id,               // keep CRM column in sync
          customer_id,
          from_status: from_status ?? null,
          to_status,
          note: body ?? null,
          changed_by_label: "CRM System",
        })

      if (logErr) throw new Error(`status log insert: ${logErr.message}`)
    }

    // 6. Mark processed
    await markProcessed(tracking_id, "success")

    return NextResponse.json({ ok: true })

  } catch (err) {
    const msg = (err as Error).message
    console.error("[webhook/crm] Error:", msg)
    await markProcessed(tracking_id, "failed").catch(() => {})
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/webhooks/crm" })
}
