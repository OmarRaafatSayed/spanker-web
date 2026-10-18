/**
 * GET /api/admin/customers/[id]/documents
 * Fetch all documents for a specific customer (admin/staff only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
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

  const { id: customerId } = await params;
  const supabase = getServiceClient();

  // Get the customer's auth user_id via their profile
  const { data: customer, error: customerError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("id", customerId)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  const { data: documents, error: documentsError } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("client_user_id", customer.user_id)
    .order("created_at", { ascending: false });

  if (documentsError) {
    console.error("[admin/customers/documents GET]", documentsError);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents", details: documentsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: documents ?? [], total: documents?.length ?? 0 });
}
