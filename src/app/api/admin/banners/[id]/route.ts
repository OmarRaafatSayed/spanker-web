/**
 * GET    /api/admin/banners/[id]  — get single banner
 * PATCH  /api/admin/banners/[id]  — update banner (partial)
 * DELETE /api/admin/banners/[id]  — delete banner
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
// GET /api/admin/banners/[id]
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
    .from("content_banners")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Banner not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/banners/[id]
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
    "title", "subtitle", "image_url", "link_url", "position",
    "display_order", "is_active", "start_date", "end_date",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if ("position" in updates) {
    const VALID = ["hero", "secondary", "footer"];
    if (!VALID.includes(updates.position as string)) {
      return NextResponse.json(
        { success: false, error: `position must be one of: ${VALID.join(", ")}` },
        { status: 400 }
      );
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("content_banners")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update banner", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "banner_updated",
    `Banner updated: ${id}`,
    "cms",
    { banner_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/banners/[id]
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
    .from("content_banners")
    .select("title, position")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("content_banners").delete().eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Banner not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete banner", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "banner_deleted",
    `Banner deleted: "${existing?.title ?? id}" (${existing?.position ?? ""})`,
    "cms",
    { banner_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
