/**
 * PATCH  /api/admin/hotels/[id]/rooms/[roomId]  — update a room
 * DELETE /api/admin/hotels/[id]/rooms/[roomId]  — delete a room
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
// PATCH /api/admin/hotels/[id]/rooms/[roomId]
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: hotelId, roomId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const ALLOWED_FIELDS = [
    "room_type", "board_type", "price_per_night", "currency",
    "max_occupancy", "description", "images", "is_available",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_rooms")
    .update(updates)
    .eq("id", roomId)
    .eq("hotel_id", hotelId)
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels/rooms PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update room", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "hotel_room_updated",
    `Room updated: ${roomId} in hotel ${hotelId}`,
    "cms",
    { hotel_id: hotelId, room_id: roomId, updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/hotels/[id]/rooms/[roomId]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: hotelId, roomId } = await params;
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("hotel_rooms")
    .select("room_type, board_type")
    .eq("id", roomId)
    .eq("hotel_id", hotelId)
    .single();

  const { error } = await supabase
    .from("hotel_rooms")
    .delete()
    .eq("id", roomId)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error("[admin/hotels/rooms DELETE]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete room", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "hotel_room_deleted",
    `Room deleted: ${existing?.room_type ?? roomId} from hotel ${hotelId}`,
    "cms",
    { hotel_id: hotelId, room_id: roomId, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
