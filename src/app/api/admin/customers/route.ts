/**
 * GET /api/admin/customers
 * Fetch all customers with their stats
 * 
 * IMPORTANT: This endpoint is part of the Admin Dashboard
 * which has FULL ACCESS to customer data.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Fetch all profiles (customers, staff, admins)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[admin/customers] Profiles fetch error:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch customers", details: profilesError.message },
        { status: 500 }
      );
    }

    // Enhance each profile with additional stats
    const customersWithStats = await Promise.all(
      (profiles || []).map(async (profile: Record<string, unknown>) => {
        // Get travel requests count
        const { count: requestsCount } = await supabase
          .from("travel_requests")
          .select("*", { count: "exact", head: true })
          .eq("client_user_id", profile.user_id);

        // Get documents count
        const { count: documentsCount } = await supabase
          .from("customer_documents")
          .select("*", { count: "exact", head: true })
          .eq("client_user_id", profile.user_id);

        return {
          ...profile,
          travel_requests_count: requestsCount || 0,
          documents_count: documentsCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithStats,
      total: customersWithStats.length,
    });
  } catch (err) {
    console.error("[admin/customers] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
