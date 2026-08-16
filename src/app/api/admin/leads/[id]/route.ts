/**
 * GET /api/admin/leads/[id]
 * Single travel request with full document checklist, communication log,
 * linked visa application, and CRM sync state.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  // Core travel request
  const { data: lead, error: leadError } = await supabase
    .from("travel_requests")
    .select(
      `
      *,
      profiles!travel_requests_client_user_id_fkey (
        id, full_name, phone, role, user_id
      ),
      assigned_staff:profiles!travel_requests_assigned_staff_id_fkey (
        id, full_name, phone
      )
      `
    )
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  // Parallel: documents, communications, state events, linked visa app
  const [docsResult, commsResult, eventsResult, visaResult] = await Promise.all([
    supabase
      .from("customer_documents")
      .select("*")
      .eq("travel_request_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("customer_communications")
      .select("*")
      .eq("travel_request_id", id)
      .order("sent_at", { ascending: false }),

    supabase
      .from("state_machine_events")
      .select("*")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),

    lead.linked_visa_application_id
      ? supabase
          .from("visa_applications")
          .select("id, status, country_code, visa_type, created_at, updated_at")
          .eq("id", lead.linked_visa_application_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ...lead,
      documents:          docsResult.data ?? [],
      communications:     commsResult.data ?? [],
      state_history:      eventsResult.data ?? [],
      visa_application:   visaResult.data ?? null,
    },
  });
}
