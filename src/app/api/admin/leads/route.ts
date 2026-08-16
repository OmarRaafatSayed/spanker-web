/**
 * GET /api/admin/leads
 * Paginated list of all travel requests with client info, status, sync state.
 *
 * Query params:
 *   status          – PortalStatus filter
 *   country         – destination_country filter
 *   travel_type     – visa_only | visa_flight | visa_hotel | full_package
 *   assigned_staff  – UUID of assigned staff member
 *   date_from       – ISO date string (created_at >=)
 *   date_to         – ISO date string (created_at <=)
 *   search          – free-text match on profile full_name or request id
 *   page            – page number (default 1)
 *   limit           – records per page (default 20, max 100)
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

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const status        = searchParams.get("status");
  const country       = searchParams.get("country");
  const travelType    = searchParams.get("travel_type");
  const assignedStaff = searchParams.get("assigned_staff");
  const dateFrom      = searchParams.get("date_from");
  const dateTo        = searchParams.get("date_to");
  const search        = searchParams.get("search");
  const page          = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit         = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset        = (page - 1) * limit;

  const supabase = getServiceClient();

  // Build query — join profiles for client name + email
  let query = supabase
    .from("travel_requests")
    .select(
      `
      *,
      profiles!travel_requests_client_user_id_fkey (
        id, full_name, phone, role
      ),
      assigned_staff:profiles!travel_requests_assigned_staff_id_fkey (
        id, full_name
      )
      `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)        query = query.eq("status", status);
  if (country)       query = query.ilike("destination_country", `%${country}%`);
  if (travelType)    query = query.eq("travel_type", travelType);
  if (assignedStaff) query = query.eq("assigned_staff_id", assignedStaff);
  if (dateFrom)      query = query.gte("created_at", dateFrom);
  if (dateTo)        query = query.lte("created_at", dateTo);

  // Free-text: search by tracking ID (UUID prefix) only at DB level
  // Full name search is done post-query (profiles JOIN doesn't support ilike in Supabase client)
  if (search) {
    const isUUID = /^[0-9a-f-]{8,}/i.test(search);
    if (isUUID) query = query.ilike("id", `${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/leads GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads", details: error.message },
      { status: 500 }
    );
  }

  // Post-filter by name search if needed
  let results = data ?? [];
  if (search && !/^[0-9a-f-]{8,}/i.test(search)) {
    const lower = search.toLowerCase();
    results = results.filter((r: Record<string, unknown>) => {
      const profile = r.profiles as { full_name?: string } | null;
      return profile?.full_name?.toLowerCase().includes(lower);
    });
  }

  const total = count ?? results.length;

  return NextResponse.json({
    success: true,
    data: results,
    total,
    page,
    limit,
    has_more: offset + limit < total,
  });
}
