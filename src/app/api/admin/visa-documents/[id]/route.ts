/**
 * GET    /api/admin/visa-documents/[id]  — get single document requirement
 * PATCH  /api/admin/visa-documents/[id]  — update document requirement
 * DELETE /api/admin/visa-documents/[id]  — delete document requirement
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
// GET /api/admin/visa-documents/[id]
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
    .from("visa_document_requirements")
    .select("*, visa_types(id, visa_name, country_name, country_code)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Document requirement not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/visa-documents/[id]
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
    "country_code", "visa_type_id", "document_key", "document_label",
    "is_required", "conditions", "sort_order",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (updates.country_code) {
    updates.country_code = (updates.country_code as string).toUpperCase();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("visa_document_requirements")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/visa-documents PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Document requirement not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update document requirement", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "visa_document_requirement_updated",
    `Document requirement updated: ${id}`,
    "cms",
    { doc_req_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/visa-documents/[id]
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
    .from("visa_document_requirements")
    .select("document_key, country_code")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("visa_document_requirements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/visa-documents DELETE]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Document requirement not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete document requirement", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "warning",
    "visa_document_requirement_deleted",
    `Document requirement deleted: ${existing?.document_key ?? id} (${existing?.country_code ?? ""})`,
    "cms",
    { doc_req_id: id, deleted_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: null });
}
