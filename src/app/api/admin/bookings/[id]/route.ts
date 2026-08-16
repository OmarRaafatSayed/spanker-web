/**
 * GET /api/admin/bookings/[id]
 * Full booking detail with financial transactions, linked quotation, and user.
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
    .from("bookings")
    .select(
      `
      *,
      users!bookings_user_id_fkey (
        id, email, first_name, last_name, phone
      ),
      quotations!bookings_quotation_id_fkey (
        id, total_amount, currency, status, items, sent_at, accepted_at, valid_until
      ),
      financial_transactions (
        *
      )
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  // Calculate balance summary
  const transactions = (data.financial_transactions as Array<{
    amount_paid: number;
    remaining_balance: number;
  }>) ?? [];

  const totalPaid = transactions.reduce((sum, t) => sum + (t.amount_paid ?? 0), 0);
  const latestRemaining = transactions.length > 0
    ? transactions[transactions.length - 1].remaining_balance
    : (data.quotations as { total_amount?: number } | null)?.total_amount ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      total_paid:        totalPaid,
      remaining_balance: latestRemaining,
    },
  });
}
