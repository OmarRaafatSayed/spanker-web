/**
 * POST /api/admin/quotations/[id]/convert
 * Convert a pending quotation (travel_request) to confirmed booking.
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
    .select("id, booking_status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
  }

  if (existing.booking_status === "confirmed") {
    return NextResponse.json(
      { success: false, error: "Quotation is already confirmed" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("travel_requests")
    .update({
      booking_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/quotations/convert POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to convert quotation", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, message: "Quotation converted to confirmed booking" });
}
