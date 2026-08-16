/**
 * GET  /api/admin/offers  — list offers (filters: type, active, destination)
 * POST /api/admin/offers  — create offer
 *
 * Query params:
 *   type        – flight | hotel | visa | package
 *   active      – true | false
 *   destination – partial match
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

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const type        = searchParams.get("type");
  const activeParam = searchParams.get("active");
  const destination = searchParams.get("destination");

  const supabase = getServiceClient();

  let query = supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });

  if (type)        query = query.eq("offer_type", type);
  if (destination) query = query.ilike("destination", `%${destination}%`);

  if (activeParam === "true") {
    const now = new Date().toISOString();
    query = query
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`);
  } else if (activeParam === "false") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[admin/offers GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch offers", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, total: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, offer_type, destination, discounted_price } = body;

  if (!title || !offer_type || !destination || discounted_price == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, offer_type, destination, discounted_price" },
      { status: 400 }
    );
  }

  const VALID_TYPES = ["flight", "hotel", "visa", "package"];
  if (!VALID_TYPES.includes(offer_type as string)) {
    return NextResponse.json(
      { success: false, error: `Invalid offer_type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const originalPrice   = body.original_price != null ? Number(body.original_price) : null;
  const discountedPrice = Number(discounted_price);
  let discountPercent   = body.discount_percent != null ? Number(body.discount_percent) : null;
  if (originalPrice && !discountPercent && originalPrice > discountedPrice) {
    discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100 * 100) / 100;
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("offers")
    .insert({
      title:                title as string,
      offer_type:           offer_type as string,
      destination:          destination as string,
      original_price:       originalPrice,
      discounted_price:     discountedPrice,
      discount_percent:     discountPercent,
      currency:             (body.currency as string | undefined) ?? "EGP",
      start_date:           (body.start_date as string | undefined) ?? null,
      end_date:             (body.end_date as string | undefined) ?? null,
      description:          (body.description as string | undefined) ?? null,
      terms_and_conditions: (body.terms_and_conditions as string | undefined) ?? null,
      images:               (body.images as unknown[]) ?? [],
      available_slots:      body.available_slots != null ? Number(body.available_slots) : null,
      is_active:            body.is_active !== undefined ? Boolean(body.is_active) : true,
      created_by:           auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/offers POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create offer", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "offer_created",
    `Offer created: ${title} (${offer_type} → ${destination})`,
    "cms",
    { offer_id: data.id, offer_type, destination, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
