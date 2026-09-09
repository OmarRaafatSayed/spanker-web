/**
 * POST /api/v1/flights
 * ====================
 * Create a new flight (staff only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = getServiceClient();
    
    // Check staff role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const profile = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile.error || !profile.data || !["admin", "staff"].includes(profile.data.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { origin, destination, departure_at, arrival_at, class: travelClass, seats_total, seats_available, base_price, currency, airline, flight_number, baggage_kg, refundable } = body;

    // Validate required fields
    if (!airline || !flight_number || !origin || !destination || !departure_at || !arrival_at || !travelClass || !seats_total || !seats_available || !base_price || !currency) {
      return NextResponse.json(
        { error: "Missing required fields", details: { airline: !!airline, flight_number: !!flight_number, origin: !!origin, destination: !!destination, departure_at: !!departure_at, arrival_at: !!arrival_at, class: !!travelClass, seats_total: !!seats_total, seats_available: !!seats_available, base_price: !!base_price, currency: !!currency } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("flights")
      .insert([{
        airline,
        flight_number,
        origin_iata: origin.toUpperCase(),
        destination_iata: destination.toUpperCase(),
        departure_at,
        arrival_at,
        class: travelClass,
        seats_total,
        seats_available,
        base_price,
        currency: currency.toUpperCase(),
        baggage_kg: baggage_kg ?? 0,
        refundable: refundable ?? false,
        is_public: true,
        enabled: true,
      }])
      .select()
      .single();

    if (error) {
      console.error("[flights/create] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}