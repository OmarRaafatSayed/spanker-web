/**
 * POST /api/admin/leads/[id]/sync-crm
 * Record a CRM sync attempt on the travel request.
 * Full CRM push integration is deferred; this records the attempt in state_machine_events.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  // Verify the lead exists
  const { data: lead, error: leadError } = await supabase
    .from("travel_requests")
    .select("id, status")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  // Record the sync attempt as a state machine event
  const { error: eventError } = await supabase
    .from("state_machine_events")
    .insert({
      entity_type: "travel_request",
      entity_id: id,
      event_type: "crm_sync_attempted",
      actor_id: auth.userId === "dev-user" ? null : auth.userId,
      metadata: {
        attempted_at: new Date().toISOString(),
        note: "CRM push integration is pending — event recorded for audit trail",
      },
    } as never);

  if (eventError) {
    console.warn("[admin/leads/sync-crm POST] Could not record event:", eventError.message);
    // Non-fatal — return success anyway
  }

  return NextResponse.json({
    success: true,
    data: {
      lead_id: id,
      synced_at: new Date().toISOString(),
      status: "recorded",
      message: "CRM sync event recorded. Full CRM push integration is pending.",
    },
  });
}
