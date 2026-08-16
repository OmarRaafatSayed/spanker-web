/**
 * PATCH /api/admin/leads/[id]/status
 * Update travel request status with FSM validation.
 * Enforces ALLOWED_PORTAL_TRANSITIONS. Logs to state_machine_events.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import {
  isPortalStatus,
  isValidTransition,
  isTerminalStatus,
  type PortalStatus,
} from "@/types/visa-states";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { status: newStatus } = body;

  if (!newStatus || !isPortalStatus(newStatus)) {
    return NextResponse.json(
      { success: false, error: "Invalid status value" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Fetch current status
  const { data: lead, error: fetchError } = await supabase
    .from("travel_requests")
    .select("status, client_user_id")
    .eq("id", id)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  const currentStatus = lead.status as PortalStatus;

  // Validate FSM transition
  if (currentStatus === newStatus) {
    return NextResponse.json(
      { success: false, error: "Status is already set to that value" },
      { status: 422 }
    );
  }

  if (isTerminalStatus(currentStatus)) {
    return NextResponse.json(
      { success: false, error: `Status '${currentStatus}' is terminal and cannot be changed` },
      { status: 422 }
    );
  }

  if (!isValidTransition(currentStatus, newStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid transition: '${currentStatus}' → '${newStatus}'`,
      },
      { status: 422 }
    );
  }

  // Apply update
  const { data, error: updateError } = await supabase
    .from("travel_requests")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("[admin/leads/status PATCH]", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to update status", details: updateError.message },
      { status: 500 }
    );
  }

  // Log to state_machine_events
  await supabase.from("state_machine_events").insert({
    entity_type: "TRAVEL_REQUEST",
    entity_id: id,
    previous_state: currentStatus,
    new_state: newStatus,
    event_type: "STATUS_CHANGED",
    triggered_by: `admin:${auth.userId}`,
    payload: { changed_by: auth.userId, role: auth.role },
  });

  await logToSystemLogs(
    "info",
    "lead_status_changed",
    `Lead ${id}: ${currentStatus} → ${newStatus}`,
    "cms",
    { lead_id: id, from: currentStatus, to: newStatus, changed_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}
