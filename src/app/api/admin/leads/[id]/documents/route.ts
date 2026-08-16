/**
 * GET /api/admin/leads/[id]/documents
 * List all customer documents for a travel request.
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

  // Verify lead exists
  const { data: lead } = await supabase
    .from("travel_requests")
    .select("id")
    .eq("id", id)
    .single();

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("travel_request_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/leads/documents GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data ?? [], total: data?.length ?? 0 });
}
