import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/db/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: detail, error: detailError } = await supabase
      .from("visa_booking_details")
      .select("*, travel_request:travel_requests(*)")
      .eq("id", id)
      .single();

    if (detailError || !detail) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const travelRequest = (detail as Record<string, unknown>).travel_request as Record<string, unknown> | null;
    if (travelRequest?.client_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: detail.id,
      booking_id: detail.travel_request_id,
      reference: travelRequest?.booking_reference,
      status: detail.visa_application_id ? "submitted" : "pending",
      destination_country: detail.destination_country,
      visa_type: detail.visa_type,
      created_at: travelRequest?.created_at,
      total_amount: detail.total_price,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
