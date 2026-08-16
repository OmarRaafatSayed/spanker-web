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
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";

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
    .from("trip_packages")
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

  const { title, description, destination, price, duration } = body;

  if (!title || !description || !destination || price == null || duration == null) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields: title, description, destination, price, duration",
      },
      { status: 400 }
    );
  }

  if (Number(price) <= 0) {
    return NextResponse.json(
      { success: false, error: "price must be greater than 0" },
      { status: 400 }
    );
  }

  if (Number(duration) <= 0) {
    return NextResponse.json(
      { success: false, error: "duration must be greater than 0" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("trip_packages")
    .insert({
      title:       title as string,
      description: description as string,
      destination: destination as string,
      price:       Number(price),
      currency:    (body.currency as string | undefined) ?? "EGP",
      duration:    Number(duration),
      images:      (body.images as unknown[]) ?? [],
      features:    (body.features as unknown[]) ?? [],
      is_active:   body.is_active !== undefined ? Boolean(body.is_active) : true,
      created_by:  auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/packages POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create package", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "package_created",
    `Package created: ${title} → ${destination}`,
    "cms",
    { package_id: data.id, title, destination, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
