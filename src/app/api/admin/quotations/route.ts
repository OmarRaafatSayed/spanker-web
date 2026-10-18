/**
 * GET  /api/admin/quotations  — list quotations (travel_requests with pending status)
 * POST /api/admin/quotations  — create quotation (pending travel request)
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

// ---------------------------------------------------------------------------
// GET /api/admin/quotations
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("user_id");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const supabase = getServiceClient();

  let query = supabase
    .from("travel_requests")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // By default show pending-payment requests (unconfirmed = quotations)
  if (status) {
    query = query.eq("booking_status", status);
  } else {
    query = query.eq("booking_status", "pending_payment");
  }

  if (userId) query = query.eq("client_user_id", userId);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/quotations GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quotations", details: error.message },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data: data ?? [],
    total,
    page,
    limit,
    has_more: offset + limit < total,
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/quotations
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { client_user_id, destination_country, travel_type, vertical, total_amount, currency } = body;

  if (!client_user_id || !destination_country || !travel_type) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: client_user_id, destination_country, travel_type" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("travel_requests")
    .insert({
      client_user_id: client_user_id as string,
      user_id: client_user_id as string,
      destination_country: destination_country as string,
      travel_type: travel_type as string,
      vertical: (vertical as string | undefined) ?? null,
      booking_status: "pending_payment",
      status: "pending_documents",
      total_amount: total_amount != null ? Number(total_amount) : null,
      currency: (currency as string | undefined) ?? "EGP",
      staff_notes: (body.staff_notes as string | undefined) ?? null,
    } as never)
    .select()
    .single();

  if (error) {
    console.error("[admin/quotations POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create quotation", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
