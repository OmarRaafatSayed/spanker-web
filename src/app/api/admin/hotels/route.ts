/**
 * GET  /api/admin/hotels  — list hotels (filters: country, active)
 * POST /api/admin/hotels  — create hotel
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database, Json } from "@/types/database";

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
    .from("hotel_offers")
    .select("*")
    .order("hotel_name", { ascending: true });

  if (country) query = query.ilike("hotel_country", `%${country}%`);
  if (city) query = query.ilike("hotel_city", `%${city}%`);
  if (stars) query = query.eq("hotel_rating", Number(stars));
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

  const { hotel_name, hotel_country, hotel_city, available_from, available_to, price_per_night, room_type } = body;

  if (!hotel_name || !hotel_country || !hotel_city || !available_from || !available_to || !price_per_night || !room_type) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: hotel_name, hotel_country, hotel_city, available_from, available_to, price_per_night, room_type" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const insertData: Database['public']['Tables']['hotel_offers']['Insert'] = {
    hotel_name: hotel_name as string,
    hotel_rating: body.hotel_rating != null ? Number(body.hotel_rating) : null,
    hotel_country: hotel_country as string,
    hotel_city: hotel_city as string,
    hotel_location: (body.hotel_location as string) || '',
    room_type: room_type as string,
    board_basis: (body.board_basis as string | null) ?? null,
    price_per_night: Number(price_per_night),
    price_currency: (body.price_currency as string) || 'EGP',
    available_from: available_from as string,
    available_to: available_to as string,
    amenities: (body.amenities as Json | null) ?? null,
    cancellation_policy: (body.cancellation_policy as string | null) ?? null,
    is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    description: (body.description as string | null) ?? null,
    source: 'admin',
    created_by: auth.userId,
  };

  const { data, error } = await supabase
    .from("hotel_offers")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("[admin/hotels POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create hotel", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
