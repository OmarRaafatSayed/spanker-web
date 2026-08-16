/**
 * POST /api/admin/leads/[id]/sync-crm
 * Push the travel request to the FastAPI CRM as a visa application.
 * On success: marks travel_request.sync_status = 'synced'.
 * On failure: marks sync_status = 'failed' with error detail.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: leadId } = await params;
  const supabase = getServiceClient();

  // ── 1. Fetch lead with client profile ─────────────────────────────
  const { data: lead, error: fetchError } = await supabase
    .from("travel_requests")
    .select(
      `
      *,
      profiles!travel_requests_client_user_id_fkey (
        id, full_name, phone, user_id
      )
      `
    )
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json(
      { success: false, error: "Lead not found" },
      { status: 404 }
    );
  }

  if (lead.sync_status === "synced") {
    return NextResponse.json({
      success: true,
      data: { already_synced: true, sync_id: lead.sync_id },
    });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (!backendUrl) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_INTERNAL_URL is not configured",
      },
      { status: 503 }
    );
  }

  // ── 2. Build payload for FastAPI ───────────────────────────────────
  const profile = lead.profiles as
    | { full_name?: string; phone?: string; user_id?: string }
    | null;

  const payload = {
    portal_request_id: lead.id,
    client_user_id:    lead.client_user_id,
    full_name:         profile?.full_name ?? null,
    phone:             profile?.phone ?? null,
    destination:       lead.destination_country,
    travel_type:       lead.travel_type,
    departure_date:    lead.departure_date ?? null,
    return_date:       lead.return_date ?? null,
    traveler_count:    lead.traveler_count,
    status:            lead.status,
    customer_notes:    lead.customer_notes ?? null,
  };

  // ── 3. POST to FastAPI CRM ─────────────────────────────────────────
  let crmData: Record<string, unknown> | null = null;
  let syncError: string | null = null;

  try {
    const crmRes = await fetch(`${backendUrl}/visa/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!crmRes.ok) {
      const errText = await crmRes.text().catch(() => crmRes.statusText);
      syncError = `CRM responded ${crmRes.status}: ${errText.slice(0, 200)}`;
    } else {
      crmData = (await crmRes.json()) as Record<string, unknown>;
    }
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err);
  }

  const now = new Date().toISOString();

  // ── 4. Update sync state on travel_request ─────────────────────────
  const crmId =
    (crmData?.id as string | undefined) ??
    (crmData?.application_id as string | undefined) ??
    null;

  await supabase
    .from("travel_requests")
    .update({
      sync_status: syncError ? "failed" : "synced",
      sync_id:     crmId ?? lead.sync_id,
      last_sync_at: now,
      sync_error:  syncError,
      updated_at:  now,
    })
    .eq("id", leadId);

  if (syncError) {
    await logToSystemLogs(
      "error",
      "lead_crm_sync_failed",
      `CRM sync failed for lead ${leadId}: ${syncError}`,
      "crm",
      { lead_id: leadId, error: syncError, triggered_by: auth.userId }
    );

    return NextResponse.json(
      {
        success: false,
        error: "CRM sync failed",
        details: syncError,
      },
      { status: 502 }
    );
  }

  await logToSystemLogs(
    "success",
    "lead_crm_synced",
    `Lead ${leadId} synced to CRM (crm_id=${crmId ?? "unknown"})`,
    "crm",
    { lead_id: leadId, crm_id: crmId, triggered_by: auth.userId }
  );

  return NextResponse.json({
    success: true,
    data: {
      lead_id:    leadId,
      crm_id:     crmId,
      synced_at:  now,
      crm_response: crmData,
    },
  });
}
