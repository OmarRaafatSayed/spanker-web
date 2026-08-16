/**
 * GET    /api/admin/visa-types/[id]  — get single visa type
 * PATCH  /api/admin/visa-types/[id]  — update visa type (partial)
 * DELETE /api/admin/visa-types/[id]  — delete visa type
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
// GET /api/admin/visa-types/[id]
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
    .from("visa_types")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Visa type not found" }, { status: 404 });
  }

  // Include related document requirements
  const { data: docReqs } = await supabase
    .from("visa_document_requirements")
    .select("*")
    .eq("visa_type_id", id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({ success: true, data: { ...data, document_requirements: docReqs ?? [] } });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/visa-types/[id]
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

  // Whitelist updatable fields
  const ALLOWED_FIELDS = [
    "country_code", "country_name", "visa_name", "duration_days", "category",
    "profession_tier", "price", "deposit_amount", "child_price", "processing_days",
    "is_urgent_available", "urgent_price", "is_active", "notes",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (updates.country_code) {
    updates.country_code = (updates.country_code as string).toUpperCase();
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("visa_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/visa-types PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Visa type not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update visa type", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "visa_type_updated",
    `Visa type updated: ${id}`,
    "cms",
    { visa_type_id: id, updates: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/visa-types/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  // Fetch before delete for logging
  const { data: existing } = await supabase
    .from("visa_types")
    .select("visa_name, country_code")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("visa_types").delete().eq("id", id);

  if (error) {
    console.error("[admin/visa-types DELETE]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Visa type not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete visa type", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "visa_type_deleted",
    `Visa type deleted: ${existing?.visa_name ?? id} (${existing?.country_code ?? ""})`,
    "cms",
    { visa_type_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
