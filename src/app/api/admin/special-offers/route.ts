/**
 * GET  /api/admin/special-offers  — list special offers
 * POST /api/admin/special-offers  — create special offer
 *
 * Stores offers in content_banners with position = 'special_offer'.
 * Extra fields (offer_type, original_price, discounted_price, discount_percent,
 * currency, includes, emoji, badge, badge_color, available_slots, terms) are
 * packed as JSON in the `subtitle` column (prefixed __offer__:).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";

const OFFER_PREFIX = "__offer__:";
const POSITION     = "special_offer";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export interface OfferMeta {
  offer_type:        "flight" | "hotel" | "visa" | "package";
  destination:       string;
  duration:          string;
  original_price:    number | null;
  discounted_price:  number;
  discount_percent:  number | null;
  currency:          string;
  includes:          string[];
  emoji:             string;
  badge:             string;
  badge_color:       string;
  available_slots:   number | null;
  terms_conditions:  string;
  description:       string;
}

const DEFAULT_META: OfferMeta = {
  offer_type: "package", destination: "", duration: "",
  original_price: null, discounted_price: 0, discount_percent: null,
  currency: "EGP", includes: [], emoji: "🌟", badge: "",
  badge_color: "bg-brand-green", available_slots: null,
  terms_conditions: "", description: "",
};

function packSubtitle(meta: OfferMeta): string {
  return `${OFFER_PREFIX}${JSON.stringify(meta)}`;
}

function unpackRow(row: Record<string, unknown>) {
  const sub = row.subtitle as string | null;
  let meta: OfferMeta = { ...DEFAULT_META };
  if (sub?.startsWith(OFFER_PREFIX)) {
    try { meta = { ...DEFAULT_META, ...JSON.parse(sub.slice(OFFER_PREFIX.length)) }; }
    catch { /* ignore */ }
  }
  return { ...row, meta };
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const active    = searchParams.get("active");
  const offerType = searchParams.get("type");

  const supabase = getServiceClient();
  let query = supabase
    .from("content_banners")
    .select("*")
    .eq("position", POSITION)
    .order("display_order", { ascending: true });

  if (active !== null) query = query.eq("is_active", active === "true");

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  let rows = (data ?? []).map(unpackRow);
  if (offerType && offerType !== "all") {
    rows = rows.filter(r => r.meta.offer_type === offerType);
  }

  return NextResponse.json({ success: true, data: rows, total: rows.length });
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 }); }

  if (!body.title || !body.discounted_price) {
    return NextResponse.json({ success: false, error: "title and discounted_price are required" }, { status: 400 });
  }

  const meta: OfferMeta = {
    offer_type:       (body.offer_type as OfferMeta["offer_type"]) ?? "package",
    destination:      (body.destination as string) ?? "",
    duration:         (body.duration as string) ?? "",
    original_price:   body.original_price != null ? Number(body.original_price) : null,
    discounted_price: Number(body.discounted_price),
    discount_percent: body.discount_percent != null ? Number(body.discount_percent) : null,
    currency:         (body.currency as string) ?? "EGP",
    includes:         (body.includes as string[]) ?? [],
    emoji:            (body.emoji as string) ?? "🌟",
    badge:            (body.badge as string) ?? "",
    badge_color:      (body.badge_color as string) ?? "bg-brand-green",
    available_slots:  body.available_slots != null ? Number(body.available_slots) : null,
    terms_conditions: (body.terms_conditions as string) ?? "",
    description:      (body.description as string) ?? "",
  };

  // Auto-calc discount_percent if not provided
  if (!meta.discount_percent && meta.original_price && meta.discounted_price) {
    meta.discount_percent = Math.round(((meta.original_price - meta.discounted_price) / meta.original_price) * 100);
  }

  const supabase = getServiceClient();
  const { data: maxRow } = await supabase
    .from("content_banners").select("display_order")
    .eq("position", POSITION).order("display_order", { ascending: false }).limit(1).single();
  const nextOrder = (maxRow?.display_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("content_banners")
    .insert({
      title:          body.title as string,
      subtitle:       packSubtitle(meta),
      position:       POSITION,
      image_url:      (body.image_url as string | null) ?? null,
      link_url:       (body.link_url as string | null) ?? null,
      link_text:      (body.link_text as string | null) ?? null,
      start_date:     (body.start_date as string | null) ?? null,
      end_date:       (body.end_date as string | null) ?? null,
      is_active:      body.is_active !== undefined ? Boolean(body.is_active) : true,
      display_order:  nextOrder,
      target_audience: (body.target_audience as string | null) ?? null,
    })
    .select().single();

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: unpackRow(data as Record<string, unknown>) }, { status: 201 });
}
