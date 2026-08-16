/**
 * POST /api/admin/quotations/[id]/send
 * Transition quotation DRAFT → SENT via send_quotation() DB function.
 * Sets sent_at and valid_until (7 days). Triggers customer notification.
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

  // Verify quotation exists and is in DRAFT
  const { data: quotation } = await supabase
    .from("quotations")
    .select("id, status, total_amount, currency, user_id")
    .eq("id", id)
    .single();

  if (!quotation) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  if (quotation.status !== "DRAFT") {
    return NextResponse.json(
      { success: false, error: `Cannot send quotation in '${quotation.status}' status. Must be DRAFT.` },
      { status: 422 }
    );
  }

  // Call DB function
  const { error } = await supabase.rpc("send_quotation", { p_quote_id: id });

  if (error) {
    console.error("[admin/quotations/send POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to send quotation", details: error.message },
      { status: 500 }
    );
  }

  // Fetch updated record
  const { data: updated } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", id)
    .single();

  await logToSystemLogs(
    "success",
    "quotation_sent",
    `Quotation ${id} sent to customer (user_id=${quotation.user_id})`,
    "cms",
    { quotation_id: id, user_id: quotation.user_id, sent_by: auth.userId }
  );

  return NextResponse.json({ success: true, data: updated });
}
