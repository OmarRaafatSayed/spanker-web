/**
 * GET    /api/admin/hotels/[id]/rooms/[roomId]  — get single room availability entry
 * PATCH  /api/admin/hotels/[id]/rooms/[roomId]  — update room availability
 * DELETE /api/admin/hotels/[id]/rooms/[roomId]  — delete room availability entry
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { roomId } = await params;
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_room_availability")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Room availability entry not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { roomId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const ALLOWED_FIELDS = ["room_type", "date", "rooms_left"] as const;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_room_availability")
    .update(updates as never)
    .eq("id", roomId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Room availability entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update room availability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { roomId } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase.from("hotel_room_availability").delete().eq("id", roomId);

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Room availability entry not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete room availability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
