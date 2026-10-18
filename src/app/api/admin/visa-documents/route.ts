import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // visa_document_requirements table is not yet deployed in the live database.
  // Return an empty list with a migration notice rather than crashing.
  return NextResponse.json({
    success: true,
    data: [],
    total: 0,
    notice: "visa_document_requirements table is pending migration",
  });
}

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

  // visa_document_requirements table is not yet deployed.
  return NextResponse.json(
    { success: false, error: "visa_document_requirements table is pending migration" },
    { status: 503 }
  );
}
