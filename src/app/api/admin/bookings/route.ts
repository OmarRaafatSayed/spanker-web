/**
 * GET /api/admin/bookings
 * List all bookings with status filter and pagination.
 *
 * Query params:
 *   status  – PENDING_PAYMENT | CONFIRMED | COMPLETED | CANCELLED
 *   user_id – CRM users.id (UUID)
 *   page    – default 1
 *   limit   – default 20
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
    .from("bookings")
    .select(
      `
      *,
      users!bookings_user_id_fkey (
        id, email, first_name, last_name, phone
      ),
      quotations!bookings_quotation_id_fkey (
        id, total_amount, currency, status
      ),
      financial_transactions (
        id, amount_paid, remaining_balance, payment_method, paid_at
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
    console.error("[admin/bookings GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings", details: error.message },
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
