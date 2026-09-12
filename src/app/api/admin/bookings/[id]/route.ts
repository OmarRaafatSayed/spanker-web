import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";
import { TABLES } from "@/lib/db/schema";

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
    .from(TABLES.travelRequests)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  const { data: payments } = await supabase
    .from(TABLES.paymentRecords)
    .select("id, amount, remaining_balance, payment_method, status, payment_date")
    .eq("booking_id", id);

  const transactions = (payments ?? []) as Array<{ amount: number; remaining_balance: number | null }>;
  const totalPaid = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const latestRemaining = transactions.length > 0
    ? transactions[transactions.length - 1].remaining_balance
    : (data.total_amount ?? 0);

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      payment_records: payments ?? [],
      total_paid:        totalPaid,
      remaining_balance: latestRemaining,
    },
  });
}
