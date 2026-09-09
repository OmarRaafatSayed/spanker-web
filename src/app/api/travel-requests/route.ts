/**
 * POST /api/travel-requests
 * Server-side route — uses Supabase service_role key to bypass RLS.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

const TravelRequestSchema = z.object({
  client_user_id: z.string().uuid("client_user_id must be a valid UUID"),
  destination_country: z.string().min(1, "destination_country is required"),
  travel_type: z.string().min(1, "travel_type is required"),
  departure_date: z.string().nullable().optional(),
  return_date: z.string().nullable().optional(),
  traveler_count: z.number().int().min(1).max(50).default(1),
  customer_notes: z.string().max(2000).nullable().optional(),
});

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
    const raw = await req.json();
    const parsed = TravelRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      client_user_id, destination_country, travel_type,
      departure_date, return_date, traveler_count, customer_notes,
    } = parsed.data;

    const db = getServiceClient();
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
