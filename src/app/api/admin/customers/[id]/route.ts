/**
 * GET   /api/admin/customers/[id]  — full profile with travel history, documents,
 *                                    communications, quotations, bookings, transactions
 * PATCH /api/admin/customers/[id]  — update profile fields
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
  ]);

  // Get payment records for this user's bookings
  const { data: paymentsData } = await supabase
    .from("payment_records")
    .select("*")
    .eq("client_user_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    success: true,
    data: {
      profile,
      travel_requests: travelRequestsResult.data ?? [],
      documents:       documentsResult.data ?? [],
      communications:  communicationsResult.data ?? [],
      payments:        paymentsData ?? [],
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

  const ALLOWED_FIELDS = ["full_name", "phone"] as const;

  const updates: Partial<Database['public']['Tables']['profiles']['Update']> = { 
    updated_at: new Date().toISOString() 
  };
  
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updates[field] = body[field] as string;
    }
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

  return NextResponse.json({ success: true, data });
}
