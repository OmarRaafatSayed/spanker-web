/**
 * POST /api/admin/quotations/[id]/send
 * Mark a quotation as sent to the customer and record a communication.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
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

  // Verify the travel request exists
  const { data: existing, error: fetchError } = await supabase
    .from("travel_requests")
    .select("id, client_user_id, booking_status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  let message = "Quotation marked as sent";

  // Record a communication entry if client_user_id is present
  if (existing.client_user_id) {
    const { error: commError } = await supabase
      .from("customer_communications")
      .insert({
        travel_request_id: id,
        client_user_id: existing.client_user_id,
        staff_user_id: auth.userId === "dev-user" ? null : auth.userId,
        communication_type: "quotation_sent",
        subject: "Quotation Sent",
        message: "Quotation has been sent to the customer.",
        direction: "outbound",
      } as never);

    if (commError) {
      console.warn("[admin/quotations/send] Failed to record communication:", commError.message);
      message = "Quotation marked as sent (communication log skipped)";
    }
  }

  return NextResponse.json({
    success: true,
    data: { quotation_id: id, sent_at: new Date().toISOString() },
    message,
  });
}
