/**
 * GET    /api/admin/offers/[id]  — get single offer
 * PATCH  /api/admin/offers/[id]  — update offer (partial)
 * DELETE /api/admin/offers/[id]  — delete offer
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
// GET /api/admin/offers/[id]
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
    .from("offers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/offers/[id]
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
    "title", "offer_type", "destination", "original_price", "discounted_price",
    "discount_percent", "currency", "start_date", "end_date", "description",
    "terms_and_conditions", "images", "available_slots", "is_active",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  // Recalculate discount if both prices are present in the update
  if ("original_price" in updates && "discounted_price" in updates && !("discount_percent" in body)) {
    const orig = Number(updates.original_price);
    const disc = Number(updates.discounted_price);
    if (orig > disc) {
      updates.discount_percent = Math.round(((orig - disc) / orig) * 100 * 100) / 100;
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("offers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/offers PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update offer", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "offer_updated",
    `Offer updated: ${id}`,
    "cms",
    { offer_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/offers/[id]
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
    .from("offers")
    .select("title, offer_type")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("offers").delete().eq("id", id);

  if (error) {
    console.error("[admin/offers DELETE]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete offer", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "offer_deleted",
    `Offer deleted: ${existing?.title ?? id}`,
    "cms",
    { offer_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
