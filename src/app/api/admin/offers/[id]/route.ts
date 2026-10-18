/**
 * GET    /api/admin/offers/[id]   — get single offer (hotel_offers, flights, or trips by vertical)
 * PATCH  /api/admin/offers/[id]   — update hotel offer (primary use case)
 * DELETE /api/admin/offers/[id]   — delete hotel offer
 *
 * The "offers" abstraction maps to hotel_offers by default.
 * Use ?vertical=flight or ?vertical=trip for other inventories.
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

  const { id } = await params;
  const vertical = new URL(req.url).searchParams.get("vertical") ?? "hotel";
  const supabase = getServiceClient();

  if (vertical === "flight") {
    const { data, error } = await supabase.from("flights").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    return NextResponse.json({ success: true, data, vertical: "flight" });
  }

  if (vertical === "trip") {
    const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    return NextResponse.json({ success: true, data, vertical: "trip" });
  }

  // Default: hotel_offers
  const { data, error } = await supabase.from("hotel_offers").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
  return NextResponse.json({ success: true, data, vertical: "hotel" });
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

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const updates = { ...body, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("hotel_offers")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Failed to update offer", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  const { error } = await supabase.from("hotel_offers").delete().eq("id", id);

  if (error) {
    if (error.code === "PGRST116") return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    return NextResponse.json({ success: false, error: "Failed to delete offer", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: null });
}
