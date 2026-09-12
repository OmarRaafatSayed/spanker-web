import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/db/schema";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: bookings, error: bookingsError } = await supabase
      .from(TABLES.travelRequests)
      .select("*, visa_booking_details(*)")
      .eq("client_user_id", user.id)
      .eq("vertical", "visa")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 400 });
    }

    const results = (bookings ?? []).map((booking) => {
      const details = Array.isArray((booking as Record<string, unknown>).visa_booking_details)
        ? ((booking as Record<string, unknown>).visa_booking_details as Record<string, unknown>[])[0]
        : ((booking as Record<string, unknown>).visa_booking_details as Record<string, unknown> | null);

      return {
        id: details?.id || booking.id,
        booking_id: booking.id,
        reference: booking.booking_reference,
        status: booking.booking_status || "pending",
        destination_country: details?.destination_country || booking.destination_country,
        submitted_at: booking.created_at,
        created_at: booking.created_at,
      };
    });

    return NextResponse.json({ results, count: results.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
