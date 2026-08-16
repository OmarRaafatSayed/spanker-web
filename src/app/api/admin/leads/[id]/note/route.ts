/**
 * POST /api/admin/leads/[id]/note
 * Append a staff note to a travel request.
 * Notes are appended (timestamped) to the staff_notes field.
 * Body: { note: string }
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { note } = body;

  if (!note || typeof note !== "string" || !note.trim()) {
    return NextResponse.json({ success: false, error: "note is required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch existing staff_notes
  const { data: lead, error: fetchError } = await supabase
    .from("travel_requests")
    .select("staff_notes")
    .eq("id", id)
    .single();

  if (fetchError || !lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  // Append new note with timestamp and author
  const timestamp = new Date().toISOString();
  const noteEntry = `[${timestamp}] [${auth.role}:${auth.userId}]\n${note.trim()}`;
  const existing = lead.staff_notes ? lead.staff_notes.trim() : "";
  const updatedNotes = existing ? `${existing}\n\n---\n\n${noteEntry}` : noteEntry;

  const { data, error } = await supabase
    .from("travel_requests")
    .update({
      staff_notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/leads/note POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to save note", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "lead_note_added",
    `Note added to lead ${id}`,
    "cms",
    { lead_id: id, added_by: auth.userId }
  );

  return NextResponse.json({
    success: true,
    data: {
      id: data.id,
      staff_notes: data.staff_notes,
      updated_at: data.updated_at,
    },
  });
}
