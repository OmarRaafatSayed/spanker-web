/**
 * PATCH /api/admin/bookings/[id]/status
 * Manual status override for edge cases.
 * Body: { status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }
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

const VALID_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
type BookingStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(
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

  const newStatus = (body.status as string | undefined)?.toUpperCase();

  if (!newStatus || !VALID_STATUSES.includes(newStatus as BookingStatus)) {
    return NextResponse.json(
      { success: false, error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, user_id")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  }

  const previousStatus = booking.status as string;

  const updates: Record<string, unknown> = {
    status:     newStatus,
    updated_at: new Date().toISOString(),
  };
  if (newStatus === "COMPLETED") updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[admin/bookings/status PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update booking status", details: error.message },
      { status: 500 }
    );
  }

  // Log to state_machine_events
  await supabase.from("state_machine_events").insert({
    entity_type:    "BOOKING",
    entity_id:      id,
    previous_state: previousStatus,
    new_state:      newStatus,
    event_type:     "BOOKING_STATUS_CHANGED",
    triggered_by:   `admin:${auth.userId}`,
    payload:        { changed_by: auth.userId, role: auth.role },
  });

  await logToSystemLogs(
    "warning",
    "booking_status_overridden",
    `Booking ${id} manually changed: ${previousStatus} → ${newStatus}`,
    "cms",
    {
      booking_id:      id,
      previous_status: previousStatus,
      new_status:      newStatus,
      changed_by:      auth.userId,
    }
  );

  return NextResponse.json({ success: true, data });
}
