/**
 * PATCH /api/admin/notifications/[id]/read
 * Mark a notification as read.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
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
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("crm_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, is_read, read_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
