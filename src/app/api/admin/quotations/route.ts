/**
 * GET  /api/admin/quotations  — list quotations (filters: status, user_id)
 * POST /api/admin/quotations  — create quotation via create_quotation() DB function
 *
 * Query params:
 *   status  – DRAFT | SENT | ACCEPTED | EXPIRED | REJECTED | CONVERTED
 *   user_id – CRM users.id (UUID)
 *   page    – default 1
 *   limit   – default 20
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
// GET /api/admin/quotations
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status");
  const userId  = searchParams.get("user_id");
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset  = (page - 1) * limit;

  const supabase = getServiceClient();

  let query = supabase
    .from("quotations")
    .select(
      `
      *,
      users!quotations_user_id_fkey (
        id, email, first_name, last_name, phone
      )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)  query = query.eq("status", status.toUpperCase());
  if (userId)  query = query.eq("user_id", userId);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/quotations GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quotations", details: error.message },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data:     data ?? [],
    total,
    page,
    limit,
    has_more: offset + limit < total,
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/quotations
// Body: { user_id, visa_application_id?, items: QuotationItem[], total_amount, currency? }
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

  const { user_id, items, total_amount } = body;

  if (!user_id || !items || !Array.isArray(items) || total_amount == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: user_id, items, total_amount" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Validate user exists in CRM users table
  const { data: crmUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", user_id as string)
    .single();

  if (!crmUser) {
    return NextResponse.json(
      { success: false, error: "user_id does not reference a valid CRM user" },
      { status: 400 }
    );
  }

  // Use DB function create_quotation()
  const { data, error } = await supabase.rpc("create_quotation", {
    p_user_id:        user_id as string,
    p_visa_app_id:    (body.visa_application_id as string | undefined) ?? null,
    p_items:          items,
    p_total_amount:   Number(total_amount),
    p_currency:       (body.currency as string | undefined) ?? "EGP",
  });

  if (error) {
    console.error("[admin/quotations POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create quotation", details: error.message },
      { status: 500 }
    );
  }

  // Fetch the created quotation
  const { data: created } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", data as string)
    .single();

  await logToSystemLogs(
    "success",
    "quotation_created",
    `Quotation created for user ${crmUser.email} (${user_id})`,
    "cms",
    {
      quotation_id: data,
      user_id,
      total_amount,
      created_by: auth.userId,
    }
  );

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
