/**
 * GET    /api/admin/packages/[id]  — get single package (trip)
 * PATCH  /api/admin/packages/[id]  — update package
 * DELETE /api/admin/packages/[id]  — delete package
 *
 * "Packages" map to the trips table.
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
  const supabase = getServiceClient();

  const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
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

  const ALLOWED_FIELDS = [
    "name", "destination", "description", "duration_days",
    "start_date", "end_date", "price_per_person", "currency",
    "max_travelers", "available_spots", "is_active", "is_public",
    "inclusions", "exclusions", "itinerary",
  ] as const;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("trips")
    .update(updates as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update package", details: error.message },
      { status: 500 }
    );
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

  const { error } = await supabase.from("trips").delete().eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete package", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: null });
}
