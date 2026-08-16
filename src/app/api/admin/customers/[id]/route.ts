/**
 * GET   /api/admin/customers/[id]  — full profile with travel history, documents,
 *                                    communications, quotations, bookings, transactions
 * PATCH /api/admin/customers/[id]  — update profile fields
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

// ---------------------------------------------------------------------------
// GET /api/admin/customers/[id]
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const supabase = getServiceClient();

  // Fetch profile — id is the profiles.id (UUID)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
  }

  const userId = profile.user_id as string;

  // Parallel fetches for all related data
  const [
    travelRequestsResult,
    documentsResult,
    communicationsResult,
    userResult,
  ] = await Promise.all([
    supabase
      .from("travel_requests")
      .select("*")
      .eq("client_user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("customer_documents")
      .select("*")
      .eq("client_user_id", userId)
      .order("created_at", { ascending: false }),

    supabase
      .from("customer_communications")
      .select("*")
      .eq("client_user_id", userId)
      .order("sent_at", { ascending: false }),

    // CRM users table (for quotations/bookings foreign key)
    supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", userId)
      .single(),
  ]);

  const crmUserId = userResult.data?.id ?? null;

  // If there's a CRM user record, also fetch quotations and bookings
  let quotations: unknown[] = [];
  let bookings: unknown[] = [];
  let transactions: unknown[] = [];

  if (crmUserId) {
    const [quotationsResult, bookingsResult] = await Promise.all([
      supabase
        .from("quotations")
        .select("*")
        .eq("user_id", crmUserId)
        .order("created_at", { ascending: false }),

      supabase
        .from("bookings")
        .select("*, financial_transactions(*)")
        .eq("user_id", crmUserId)
        .order("created_at", { ascending: false }),
    ]);

    quotations = quotationsResult.data ?? [];
    bookings   = bookingsResult.data ?? [];

    // Flatten transactions from bookings
    transactions = (bookingsResult.data ?? []).flatMap(
      (b: Record<string, unknown>) =>
        (b.financial_transactions as unknown[]) ?? []
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      profile,
      crm_user_id:     crmUserId,
      travel_requests: travelRequestsResult.data ?? [],
      documents:       documentsResult.data ?? [],
      communications:  communicationsResult.data ?? [],
      quotations,
      bookings,
      transactions,
    },
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/customers/[id]
// ---------------------------------------------------------------------------
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

  const ALLOWED_FIELDS = ["full_name", "phone"];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update customer", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "customer_profile_updated",
    `Profile updated for customer ${id}`,
    "cms",
    { profile_id: id, fields: Object.keys(body), updated_by: auth.userId }
  );

  return NextResponse.json({ success: true, data });
}
