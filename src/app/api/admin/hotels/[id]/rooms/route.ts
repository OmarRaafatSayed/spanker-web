/**
 * GET  /api/admin/hotels/[id]/rooms  — list room availability for a hotel
 * POST /api/admin/hotels/[id]/rooms  — create room availability entry
 *
 * Uses hotel_room_availability table.
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
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: hotelId } = await params;

  // Validate UUID format to avoid Postgres errors on invalid input
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(hotelId)) {
    return NextResponse.json({ success: false, error: "Hotel not found" }, { status: 404 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_room_availability")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("date", { ascending: true });

  if (error) {
    console.error("[admin/hotels/rooms GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room availability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data ?? [], total: data?.length ?? 0 });
}

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

  const { room_type, date, rooms_left } = body;
  if (!room_type || !date) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: room_type, date" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_room_availability")
    .insert({
      hotel_id: hotelId,
      room_type: room_type as string,
      date: date as string,
      rooms_left: rooms_left != null ? Number(rooms_left) : 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels/rooms POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room availability", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
