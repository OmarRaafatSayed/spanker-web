/**
 * GET /api/admin/customers/[id]/travel-requests
 * Fetch all travel requests for a specific customer
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // First, get the customer's user_id
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch travel requests for this user
    const { data: requests, error: requestsError } = await supabase
      .from("travel_requests")
      .select("*")
      .eq("client_user_id", customer.user_id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("[travel-requests] Error:", requestsError);
      return NextResponse.json(
        { error: "Failed to fetch travel requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
    });
  } catch (err) {
    console.error("[travel-requests] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
