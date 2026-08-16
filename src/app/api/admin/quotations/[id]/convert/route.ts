/**
 * POST /api/admin/quotations/[id]/convert
 * Accept quotation and create booking via accept_quotation_and_create_booking() DB function.
 * Status transitions: SENT → ACCEPTED, creates booking PENDING_PAYMENT.
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  // Verify quotation exists and is in SENT status
  const { data: quotation } = await supabase
    .from("quotations")
    .select("id, status, total_amount, currency, user_id")
    .eq("id", id)
    .single();

  if (!quotation) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  if (quotation.status !== "SENT") {
    return NextResponse.json(
      {
        success: false,
        error: `Cannot convert quotation in '${quotation.status}' status. Must be SENT.`,
      },
      { status: 422 }
    );
  }

  // Call DB function — returns the new booking UUID
  const { data: bookingId, error } = await supabase.rpc(
    "accept_quotation_and_create_booking",
    { p_quote_id: id }
  );

  if (error) {
    console.error("[admin/quotations/convert POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to convert quotation", details: error.message },
      { status: 500 }
    );
  }

  // Fetch the created booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, financial_transactions(*)")
    .eq("id", bookingId as string)
    .single();

  await logToSystemLogs(
    "success",
    "quotation_converted",
    `Quotation ${id} converted to booking ${bookingId}`,
    "cms",
    {
      quotation_id: id,
      booking_id: bookingId,
      user_id: quotation.user_id,
      total_amount: quotation.total_amount,
      converted_by: auth.userId,
    }
  );

  return NextResponse.json({
    success: true,
    data: {
      quotation_id: id,
      booking_id:   bookingId,
      booking,
    },
  });
}
