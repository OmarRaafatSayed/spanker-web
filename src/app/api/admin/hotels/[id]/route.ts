/**
 * GET    /api/admin/hotels/[id]  — get single hotel with rooms
 * PATCH  /api/admin/hotels/[id]  — update hotel
 * DELETE /api/admin/hotels/[id]  — delete hotel
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

// ---------------------------------------------------------------------------
// GET /api/admin/hotels/[id]
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotels")
    .select("*, hotel_rooms(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/hotels/[id]
// ---------------------------------------------------------------------------
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

  const ALLOWED_FIELDS = [
    "name", "stars", "country", "city", "address", "google_maps_url",
    "amenities", "check_in_time", "check_out_time", "cancellation_policy",
    "booking_conditions", "is_active", "cover_image", "images", "description",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotels")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update hotel", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "hotel_updated",
    `Hotel updated: ${id}`,
    "cms",
    { hotel_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/hotels/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("hotels")
    .select("name, city, country")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("hotels").delete().eq("id", id);

  if (error) {
    console.error("[admin/hotels DELETE]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete hotel", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "hotel_deleted",
    `Hotel deleted: ${existing?.name ?? id} (${existing?.city ?? ""}, ${existing?.country ?? ""})`,
    "cms",
    { hotel_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
