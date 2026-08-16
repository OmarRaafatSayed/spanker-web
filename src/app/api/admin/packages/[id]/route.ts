/**
 * GET    /api/admin/packages/[id]  — get single package
 * PATCH  /api/admin/packages/[id]  — update package (partial)
 * DELETE /api/admin/packages/[id]  — delete package
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
// GET /api/admin/packages/[id]
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
    .from("trip_packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/packages/[id]
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
    "title", "description", "destination", "price", "currency",
    "duration", "images", "features", "is_active",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("trip_packages")
    .update(updates)
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

  await logToSystemLogs(
    "info",
    "package_updated",
    `Package updated: ${id}`,
    "cms",
    { package_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/packages/[id]
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
    .from("trip_packages")
    .select("title, destination")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("trip_packages").delete().eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete package", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "package_deleted",
    `Package deleted: ${existing?.title ?? id}`,
    "cms",
    { package_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
