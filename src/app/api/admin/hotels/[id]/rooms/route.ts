/**
 * POST /api/admin/hotels/[id]/rooms  — add a room type to a hotel
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
// POST /api/admin/hotels/[id]/rooms
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: hotelId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { room_type, board_type, price_per_night } = body;

  if (!room_type || !board_type || price_per_night == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: room_type, board_type, price_per_night" },
      { status: 400 }
    );
  }

  const VALID_BOARD_TYPES = ["room_only", "bed_breakfast", "half_board", "full_board"];
  if (!VALID_BOARD_TYPES.includes(board_type as string)) {
    return NextResponse.json(
      { success: false, error: `Invalid board_type. Must be one of: ${VALID_BOARD_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Verify hotel exists
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("id, name")
    .eq("id", hotelId)
    .single();

  if (hotelError || !hotel) {
    return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("hotel_rooms")
    .insert({
      hotel_id: hotelId,
      room_type: room_type as string,
      board_type: board_type as string,
      price_per_night: Number(price_per_night),
      currency: (body.currency as string | undefined) ?? "EGP",
      max_occupancy: body.max_occupancy != null ? Number(body.max_occupancy) : 2,
      description: (body.description as string | undefined) ?? null,
      images: (body.images as unknown[]) ?? [],
      is_available: body.is_available !== undefined ? Boolean(body.is_available) : true,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels/[id]/rooms POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "hotel_room_created",
    `Room created for hotel ${hotel.name}: ${room_type} (${board_type})`,
    "cms",
    { hotel_id: hotelId, room_id: data.id, room_type, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
