/**
 * PATCH /api/admin/leads/[id]/assign
 * Assign a staff member to a travel request.
 * Body: { staff_id: string }
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

  const { staff_id } = body;

  if (!staff_id || typeof staff_id !== "string") {
    return NextResponse.json(
      { success: false, error: "staff_id is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Validate staff_id is a real staff/admin profile
  const { data: staffProfile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("user_id", staff_id)
    .in("role", ["admin", "staff"])
    .single();

  if (!staffProfile) {
    return NextResponse.json(
      { success: false, error: "staff_id does not reference a valid staff or admin user" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("travel_requests")
    .update({
      assigned_staff_id: staff_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/leads/assign PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to assign staff", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "lead_assigned",
    `Lead ${id} assigned to ${staffProfile.full_name} (${staff_id})`,
    "cms",
    { lead_id: id, staff_id, staff_name: staffProfile.full_name, assigned_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}
