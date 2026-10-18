/**
 * GET  /api/admin/offers  — list offers (hotel_offers, with optional ?vertical= filter)
 * POST /api/admin/offers  — create hotel offer
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

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");
  const supabase = getServiceClient();

  let query = supabase
    .from("hotel_offers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (active !== null) query = query.eq("is_active", active === "true");

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/offers GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offers", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { hotel_name, city, country, price_per_night } = body;
  if (!hotel_name || !city || !country || price_per_night == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: hotel_name, city, country, price_per_night" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_offers")
    .insert(body as never)
    .select()
    .single();

  if (error) {
    console.error("[admin/offers POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create offer", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
