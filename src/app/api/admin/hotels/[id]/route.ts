/**
 * GET    /api/admin/hotels/[id]  — get single hotel with rooms
 * PATCH  /api/admin/hotels/[id]  — update hotel
 * DELETE /api/admin/hotels/[id]  — delete hotel
 *
 * NOTE: Hotels management not yet fully implemented. Uses hotel_offers table.
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
    .from("hotel_offers")
    .select("*")
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
    "hotel_name", "city", "country", "stars", "location", "amenities",
    "room_type", "board_basis", "price_per_night", "currency", "available_from",
    "available_until", "booking_deadline"
  ] as const;

  const updates: Partial<Database['public']['Tables']['hotel_offers']['Update']> = { 
    updated_at: new Date().toISOString() 
  };
  
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      (updates as Record<string, unknown>)[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("hotel_offers")
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

  const { error } = await supabase
    .from("hotel_offers")
    .delete()
    .eq("id", id);

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

  return NextResponse.json({ success: true });
}
