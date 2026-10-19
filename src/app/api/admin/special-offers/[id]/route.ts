/**
 * GET    /api/admin/special-offers/[id]
 * PATCH  /api/admin/special-offers/[id]
 * DELETE /api/admin/special-offers/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";
import type { Database } from "@/types/database";

const OFFER_PREFIX = "__offer__:";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

function unpackRow(row: Record<string, unknown>) {
  const sub = row.subtitle as string | null;
  let meta: Record<string, unknown> = {};
  if (sub?.startsWith(OFFER_PREFIX)) {
    try { meta = JSON.parse(sub.slice(OFFER_PREFIX.length)); } catch { /* ignore */ }
  }
  return { ...row, meta };
}

function packSubtitle(existing: string | null, updates: Record<string, unknown>): string {
  let meta: Record<string, unknown> = {};
  if (existing?.startsWith(OFFER_PREFIX)) {
    try { meta = JSON.parse(existing.slice(OFFER_PREFIX.length)); } catch { /* ignore */ }
  }
  // Merge meta fields from updates
  const META_KEYS = ["offer_type","destination","duration","original_price","discounted_price",
    "discount_percent","currency","includes","emoji","badge","badge_color","available_slots",
    "terms_conditions","description"];
  for (const k of META_KEYS) {
    if (k in updates) meta[k] = updates[k];
  }
  if (!meta.discount_percent && meta.original_price && meta.discounted_price) {
    const orig = Number(meta.original_price);
    const disc = Number(meta.discounted_price);
    if (orig > disc) meta.discount_percent = Math.round(((orig - disc) / orig) * 100);
  }
  return `${OFFER_PREFIX}${JSON.stringify(meta)}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("content_banners").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: unpackRow(data as Record<string, unknown>) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 }); }

  const supabase = getServiceClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("content_banners").select("subtitle").eq("id", id).single();
  if (fetchErr || !existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const BANNER_FIELDS = ["title","image_url","link_url","link_text","start_date","end_date","is_active","display_order","target_audience"];
  const bannerUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of BANNER_FIELDS) {
    if (k in body) bannerUpdates[k] = body[k];
  }

  // Always rebuild subtitle with merged meta
  bannerUpdates.subtitle = packSubtitle(existing.subtitle, body);

  const { data, error } = await supabase
    .from("content_banners").update(bannerUpdates as never).eq("id", id).select().single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: unpackRow(data as Record<string, unknown>) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase.from("content_banners").delete().eq("id", id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: null });
}
