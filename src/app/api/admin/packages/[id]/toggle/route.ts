/**
 * PATCH /api/admin/packages/[id]/toggle
 * Toggle is_active without a full update.
 * Body: { is_active: boolean }
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

  if (body.is_active === undefined || typeof body.is_active !== "boolean") {
    return NextResponse.json(
      { success: false, error: "is_active (boolean) is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("trip_packages")
    .update({
      is_active:  body.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, is_active, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to toggle package", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "package_toggled",
    `Package ${id} set is_active=${body.is_active}`,
    "cms",
    { package_id: id, is_active: body.is_active, toggled_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}
