/**
 * GET    /api/admin/visa-documents  — list document requirements (filters: country, visa_type_id)
 * POST   /api/admin/visa-documents  — create document requirement
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
// GET /api/admin/visa-documents
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const visaTypeId = searchParams.get("visa_type_id");

  const supabase = getServiceClient();

  let query = supabase
    .from("visa_document_requirements")
    .select("*, visa_types(id, visa_name, country_name)")
    .order("country_code", { ascending: true })
    .order("sort_order", { ascending: true });

  if (country) query = query.eq("country_code", country.toUpperCase());
  if (visaTypeId) query = query.eq("visa_type_id", visaTypeId);

  const { data, error } = await query;

  if (error) {
    console.error("[admin/visa-documents GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch visa document requirements", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, total: data?.length ?? 0 });
}

// ---------------------------------------------------------------------------
// POST /api/admin/visa-documents
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { country_code, document_key, document_label } = body;

  if (!country_code || !document_key || !document_label) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: country_code, document_key, document_label" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Validate visa_type_id if provided
  if (body.visa_type_id) {
    const { data: visaType } = await supabase
      .from("visa_types")
      .select("id")
      .eq("id", body.visa_type_id as string)
      .single();

    if (!visaType) {
      return NextResponse.json(
        { success: false, error: "visa_type_id does not reference a valid visa type" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("visa_document_requirements")
    .insert({
      country_code: (country_code as string).toUpperCase(),
      visa_type_id: (body.visa_type_id as string | undefined) ?? null,
      document_key: document_key as string,
      document_label: document_label as string,
      is_required: body.is_required !== undefined ? Boolean(body.is_required) : true,
      conditions: (body.conditions as Record<string, unknown> | undefined) ?? {},
      sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/visa-documents POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create document requirement", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "visa_document_requirement_created",
    `Document requirement created: ${document_key} for ${country_code}`,
    "cms",
    { doc_req_id: data.id, country_code, document_key, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
