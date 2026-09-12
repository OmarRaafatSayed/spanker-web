import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();

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

    const customersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { count: requestsCount } = await supabase
          .from("travel_requests")
          .select("*", { count: "exact", head: true })
          .eq("client_user_id", profile.user_id);

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
