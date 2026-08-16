/**
 * POST /api/admin/bookings/[id]/payment
 * Record a payment against a booking.
 * Wraps record_payment_and_generate_voucher() DB function.
 *
 * Body: { amount_paid, payment_method, receipt_url? }
 *
 * payment_method: CASH | BANK_TRANSFER | POS | CREDIT_CARD | CHEQUE
 *
 * When the booking is fully paid the DB function:
 *   - sets booking.status = CONFIRMED
 *   - sets booking.voucher_url
 *   - inserts state_machine_events row
 *   - sends crm_notifications to the customer
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

const VALID_METHODS = ["CASH", "BANK_TRANSFER", "POS", "CREDIT_CARD", "CHEQUE"] as const;
type PaymentMethod = (typeof VALID_METHODS)[number];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: bookingId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount_paid, payment_method, receipt_url } = body;

  if (amount_paid == null || Number(amount_paid) <= 0) {
    return NextResponse.json(
      { success: false, error: "amount_paid must be a positive number" },
      { status: 400 }
    );
  }

  const method = (payment_method as string | undefined)?.toUpperCase();
  if (!method || !VALID_METHODS.includes(method as PaymentMethod)) {
    return NextResponse.json(
      { success: false, error: `payment_method must be one of: ${VALID_METHODS.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Verify booking exists and is not already completed/cancelled
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, user_id")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "CANCELLED") {
    return NextResponse.json(
      { success: false, error: "Cannot record payment on a cancelled booking" },
      { status: 422 }
    );
  }

  // Get the financial_transaction record for this booking
  const { data: transaction } = await supabase
    .from("financial_transactions")
    .select("id, remaining_balance")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!transaction) {
    return NextResponse.json(
      { success: false, error: "No financial transaction found for this booking" },
      { status: 404 }
    );
  }

  // Call DB function
  const { error: rpcError } = await supabase.rpc(
    "record_payment_and_generate_voucher",
    {
      p_transaction_id: transaction.id,
      p_amount_paid:    Number(amount_paid),
      p_payment_method: method,
      p_receipt_url:    (receipt_url as string | undefined) ?? null,
    }
  );

  if (rpcError) {
    console.error("[admin/bookings/payment POST]", rpcError);
    return NextResponse.json(
      { success: false, error: "Failed to record payment", details: rpcError.message },
      { status: 500 }
    );
  }

  // Fetch updated booking + transaction
  const { data: updated } = await supabase
    .from("bookings")
    .select("*, financial_transactions(*)")
    .eq("id", bookingId)
    .single();

  await logToSystemLogs(
    "success",
    "booking_payment_recorded",
    `Payment of ${amount_paid} (${method}) recorded for booking ${bookingId}`,
    "cms",
    {
      booking_id:       bookingId,
      transaction_id:   transaction.id,
      amount_paid,
      payment_method:   method,
      recorded_by:      auth.userId,
    }
  );

  return NextResponse.json({ success: true, data: updated }, { status: 201 });
}
