/**
 * GET  /api/admin/hotels  — list hotels (filters: country, active)
 * POST /api/admin/hotels  — create hotel
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
// GET /api/admin/hotels
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const city = searchParams.get("city");
  const stars = searchParams.get("stars");
  const activeParam = searchParams.get("active");

  const supabase = getServiceClient();

  let query = supabase
    .from("hotels")
    .select("*, hotel_rooms(id, room_type, board_type, price_per_night, currency, is_available)")
    .order("name", { ascending: true });

  if (country) query = query.ilike("country", `%${country}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (stars) query = query.eq("stars", Number(stars));
  if (activeParam !== null) query = query.eq("is_active", activeParam === "true");

  const { data, error } = await query;

  if (error) {
    console.error("[admin/hotels GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hotels", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, total: data?.length ?? 0 });
}

// ---------------------------------------------------------------------------
// POST /api/admin/hotels
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, country, city } = body;

  if (!name || !country || !city) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: name, country, city" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotels")
    .insert({
      name: name as string,
      stars: body.stars != null ? Number(body.stars) : null,
      country: country as string,
      city: city as string,
      address: (body.address as string | undefined) ?? null,
      google_maps_url: (body.google_maps_url as string | undefined) ?? null,
      amenities: (body.amenities as unknown[]) ?? [],
      check_in_time: (body.check_in_time as string | undefined) ?? null,
      check_out_time: (body.check_out_time as string | undefined) ?? null,
      cancellation_policy: (body.cancellation_policy as string | undefined) ?? null,
      booking_conditions: (body.booking_conditions as string | undefined) ?? null,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      cover_image: (body.cover_image as string | undefined) ?? null,
      images: (body.images as unknown[]) ?? [],
      description: (body.description as string | undefined) ?? null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create hotel", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "hotel_created",
    `Hotel created: ${name} (${city}, ${country})`,
    "cms",
    { hotel_id: data.id, name, country, city, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
