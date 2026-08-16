/**
 * POST /api/admin/leads/[id]/communicate
 * Log a communication (email / WhatsApp / call / SMS) against a travel request.
 * Body: { type: CommunicationType, subject?: string, message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";
import type { CommunicationType } from "@/types/index";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

const VALID_COMM_TYPES: CommunicationType[] = [
  "email", "whatsapp", "sms", "phone_call", "system_notification",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id: leadId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, message, subject } = body;

  if (!type || !VALID_COMM_TYPES.includes(type as CommunicationType)) {
    return NextResponse.json(
      { success: false, error: `type must be one of: ${VALID_COMM_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Verify lead exists and get client_user_id
  const { data: lead } = await supabase
    .from("travel_requests")
    .select("id, client_user_id")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("customer_communications")
    .insert({
      travel_request_id: leadId,
      client_user_id: lead.client_user_id,
      staff_user_id: auth.userId,
      communication_type: type as CommunicationType,
      subject: (subject as string | undefined) ?? null,
      message: message.trim(),
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/leads/communicate POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to log communication", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "lead_communication_logged",
    `${type} logged for lead ${leadId}`,
    "cms",
    { lead_id: leadId, comm_type: type, logged_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
