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

  const { data, error } = await supabase
    .from("visa_document_requirements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Document requirement not found" }, { status: 404 });
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
    .update(updates as never)
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

  return NextResponse.json({ success: true, data: null });
}
