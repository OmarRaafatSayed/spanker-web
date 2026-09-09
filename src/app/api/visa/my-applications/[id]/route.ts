import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: detail, error: detailError } = await supabase
      .from("visa_booking_details")
      .select(`
        *,
        booking:bookings (
          reference,
          total_amount,
          contact,
          customer_id,
          created_at
        ),
        visa:visas (
          destination_country,
          visa_type,
          processing_days,
          price,
          service_fee,
          currency,
          validity_months,
          max_stay_days
        )
      `)
      .eq("id", id)
      .single();

    if (detailError || !detail) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (detail.booking?.customer_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: detail.id,
      booking_id: detail.booking_id,
      reference: detail.booking?.reference,
      status: detail.review_status || "pending",
      destination_country: detail.visa?.destination_country,
      visa_type: detail.visa?.visa_type,
      applicant: detail.applicant,
      submitted_at: detail.submitted_at,
      reviewed_at: detail.reviewed_at,
      notes: detail.staff_notes,
      created_at: detail.booking?.created_at,
      total_amount: detail.booking?.total_amount,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
