/**
 * GET  /api/admin/visa-types  — list visa types (filters: country, active)
 * POST /api/admin/visa-types  — create a new visa type
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
// GET /api/admin/visa-types
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const activeParam = searchParams.get("active");

  const supabase = getServiceClient();

  let query = supabase
    .from("visa_types")
    .select("*")
    .order("country_name", { ascending: true })
    .order("price", { ascending: true });

  if (country) query = query.eq("country_code", country.toUpperCase());
  if (activeParam !== null) query = query.eq("is_active", activeParam === "true");

  const { data, error } = await query;

  if (error) {
    console.error("[admin/visa-types GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch visa types", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, total: data?.length ?? 0 });
}

// ---------------------------------------------------------------------------
// POST /api/admin/visa-types
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

  const {
    country_code,
    country_name,
    visa_name,
    duration_days,
    category,
    profession_tier,
    price,
    deposit_amount,
    child_price,
    processing_days,
    is_urgent_available,
    urgent_price,
    is_active,
    notes,
  } = body;

  // Required field validation
  if (!country_code || !country_name || !visa_name || !duration_days || !category || price == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: country_code, country_name, visa_name, duration_days, category, price" },
      { status: 400 }
    );
  }

  const VALID_CATEGORIES = ["vip", "standard", "urgent", "multi_entry", "extension"];
  if (!VALID_CATEGORIES.includes(category as string)) {
    return NextResponse.json(
      { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("visa_types")
    .insert({
      country_code: (country_code as string).toUpperCase(),
      country_name: country_name as string,
      visa_name: visa_name as string,
      duration_days: Number(duration_days),
      category: category as string,
      profession_tier: (profession_tier as string | undefined) ?? null,
      price: Number(price),
      deposit_amount: deposit_amount != null ? Number(deposit_amount) : 0,
      child_price: child_price != null ? Number(child_price) : null,
      processing_days: processing_days != null ? Number(processing_days) : 3,
      is_urgent_available: Boolean(is_urgent_available ?? false),
      urgent_price: urgent_price != null ? Number(urgent_price) : null,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      notes: (notes as string | undefined) ?? null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/visa-types POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create visa type", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "visa_type_created",
    `Visa type created: ${visa_name} (${country_code})`,
    "cms",
    { visa_type_id: data.id, country_code, category, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
