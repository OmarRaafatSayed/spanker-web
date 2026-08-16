/**
 * PATCH /api/admin/customers/[id]/role
 * Change customer role — admin only.
 * Body: { role: 'admin' | 'staff' | 'customer' }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminOnly } from "@/lib/admin-auth";
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
  // Admin-only endpoint
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { role } = body;
  const VALID_ROLES = ["admin", "staff", "customer"];

  if (!role || !VALID_ROLES.includes(role as string)) {
    return NextResponse.json(
      { success: false, error: `role must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    );
  }

  // Safety: prevent self-demotion
  const supabase = getServiceClient();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("user_id, role, full_name")
    .eq("id", id)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  if (targetProfile.user_id === auth.userId) {
    return NextResponse.json(
      { success: false, error: "Cannot change your own role" },
      { status: 422 }
    );
  }

  const previousRole = targetProfile.role;

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: role as string, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update role", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "customer_role_changed",
    `Role changed for ${targetProfile.full_name ?? id}: ${previousRole} → ${role}`,
    "cms",
    {
      profile_id: id,
      previous_role: previousRole,
      new_role: role,
      changed_by: auth.userId,
    }
  );

  return NextResponse.json({ success: true, data });
}
