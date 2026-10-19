/**
 * GET  /api/admin/packages  — list trip packages (filters: active, destination)
 * POST /api/admin/packages  — create trip package
 *
 * Query params:
 *   active       – true | false
 *   destination  – partial match
 *   page         – default 1
 *   limit        – default 20
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";
import { TABLES } from '@/lib/db/schema';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// GET /api/admin/packages
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const activeParam   = searchParams.get("active");
  const destination   = searchParams.get("destination");
  const page          = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit         = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset        = (page - 1) * limit;

  const supabase = getServiceClient();

  let query = supabase
    .from(TABLES.trips)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (activeParam !== null) query = query.eq("is_active", activeParam === "true");
  if (destination)          query = query.ilike("destination", `%${destination}%`);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/packages GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packages", details: error.message },
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
// POST /api/admin/packages
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

  // Accept both old shape (title/price/duration) and new shape (name/price_per_person/duration_days)
  const name        = (body.name ?? body.title) as string | undefined;
  const destination = body.destination as string | undefined;
  const price       = body.price_per_person ?? body.price;
  const duration    = body.duration_days ?? body.duration;

  if (!name || !destination || price == null || !duration) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: name, destination, price_per_person, duration_days" },
      { status: 400 }
    );
  }

  if (Number(price) <= 0) {
    return NextResponse.json({ success: false, error: "price must be greater than 0" }, { status: 400 });
  }

  if (Number(duration) <= 0) {
    return NextResponse.json({ success: false, error: "duration must be greater than 0" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from(TABLES.trips)
    .insert({
      name:             name,
      description:      (body.description as string | undefined) ?? null,
      destination:      destination,
      price_per_person: Number(price),
      currency:         (body.currency as string | undefined) ?? "EGP",
      duration_days:    Number(duration),
      is_active:        body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_public:        body.is_public !== undefined ? Boolean(body.is_public) : true,
      available_spots:  body.available_spots != null ? Number(body.available_spots) : 20,
      max_travelers:    body.max_travelers != null ? Number(body.max_travelers) : 25,
      inclusions:       (body.inclusions as string[] | null | undefined) ?? null,
      exclusions:       (body.exclusions as string[] | null | undefined) ?? null,
      itinerary:        (body.itinerary as unknown[] | null | undefined) ?? null,
      created_by:       auth.userId && auth.userId !== "dev-user" ? auth.userId : null,
      start_date:       (body.start_date as string | undefined) ?? new Date().toISOString().split("T")[0],
      end_date:         (body.end_date as string | undefined) ?? new Date().toISOString().split("T")[0],
    } as never)
    .select()
    .single();

  if (error) {
    console.error("[admin/packages POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create package", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
