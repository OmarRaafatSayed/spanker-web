/**
 * PATCH /api/admin/leads/[id]/documents/[docId]
 * Approve or reject a customer document.
 * Body: { status: 'approved' | 'rejected', rejection_reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: leadId, docId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, rejection_reason } = body;

  if (!status || !["approved", "rejected", "under_review"].includes(status as string)) {
    return NextResponse.json(
      { success: false, error: "status must be 'approved', 'rejected', or 'under_review'" },
      { status: 400 }
    );
  }

  if (status === "rejected" && !rejection_reason) {
    return NextResponse.json(
      { success: false, error: "rejection_reason is required when rejecting a document" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("customer_documents")
    .update({
      status: status as string,
      rejection_reason: status === "rejected" ? (rejection_reason as string) : null,
      reviewed_by: auth.userId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", docId)
    .eq("travel_request_id", leadId)
    .select()
    .single();

  if (error) {
    console.error("[admin/leads/documents PATCH]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { success: false, error: "Document not found for this lead" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update document", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    status === "approved" ? "success" : "warning",
    "document_reviewed",
    `Document ${docId} ${status} for lead ${leadId}`,
    "cms",
    {
      lead_id: leadId,
      doc_id: docId,
      new_status: status,
      rejection_reason: rejection_reason ?? null,
      reviewed_by: auth.userId,
    }
  );

  return NextResponse.json({ success: true, data });
}
