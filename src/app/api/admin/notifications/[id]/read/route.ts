/**
 * POST /api/admin/notifications/[id]/read
 * Mark a portal notification as read (admin/staff can mark any notification).
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

  // Validate UUID format to avoid Postgres errors
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("portal_notifications")
    .update({ is_read: true })
    .eq("id", id)
    .select("id, is_read")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }
    console.error("[admin/notifications/read POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
