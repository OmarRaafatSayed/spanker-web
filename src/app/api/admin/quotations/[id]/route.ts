/**
 * GET /api/admin/quotations/[id]  — single quotation detail
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
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
    .from("quotations")
    .select(
      `
      *,
      users!quotations_user_id_fkey (
        id, email, first_name, last_name, phone
      ),
      visa_applications!quotations_visa_application_id_fkey (
        id, status, country_code, visa_type
      )
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}
