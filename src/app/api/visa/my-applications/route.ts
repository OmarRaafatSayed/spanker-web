import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: bookings, error: bookingsError } = await supabase
      .from("travel_requests")
      .select(`
        *,
        visa_booking_details (
          *,
          visa:visas (
            destination_country,
            visa_type,
            processing_days,
            price,
            service_fee,
            currency
          )
        )
      `)
      .eq("customer_id", user.id)
      .eq("booking_type", "visa")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 400 }
      );
    }

    const results = bookings?.map((booking) => {
      const details = Array.isArray(booking.visa_booking_details)
        ? booking.visa_booking_details[0]
        : booking.visa_booking_details;

      return {
        id: details?.id || booking.id,
        booking_id: booking.id,
        reference: booking.reference,
        status: details?.review_status || "pending",
        destination_country: details?.visa?.destination_country || "",
        visa_type: details?.visa?.visa_type || "",
        applicant_name: `${details?.applicant?.first_name || ""} ${details?.applicant?.last_name || ""}`.trim(),
        passport_number: details?.applicant?.passport_number || "",
        submitted_at: details?.submitted_at || booking.created_at,
        notes: details?.staff_notes || null,
        created_at: booking.created_at,
      };
    }) || [];

    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}