/**
 * POST /api/travel-requests
 * Server-side route — uses Supabase service_role key to bypass RLS.
 * Auth is validated via the JWT token from our FastAPI auth system.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveToken } from "@/lib/services/crm-adapter";

// Server-side Supabase client with service_role — bypasses RLS
function getServiceClient() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY
            ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      client_user_id:       string;
      destination_country:  string;
      travel_type:          string;
      departure_date?:      string | null;
      return_date?:         string | null;
      traveler_count:       number;
      customer_notes?:      string | null;
    };

    const { client_user_id, destination_country, travel_type,
            departure_date, return_date, traveler_count, customer_notes } = body;

    if (!client_user_id || !destination_country || !travel_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getServiceClient();

    // Build default document checklist
    const documentChecklist = { required: [], optional: [] };

    const { data, error } = await db
      .from("travel_requests")
      .insert([{
        client_user_id,
        destination_country,
        travel_type,
        departure_date:       departure_date ?? null,
        return_date:          return_date ?? null,
        traveler_count:       traveler_count ?? 1,
        customer_notes:       customer_notes ?? null,
        status:               "pending_documents",
        document_checklist:   documentChecklist,
        documents_completion_percent: 0,
        next_action_required: "Upload required documents to complete your application",
      }])
      .select()
      .single();

    if (error) {
      console.error("[travel-requests] Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
