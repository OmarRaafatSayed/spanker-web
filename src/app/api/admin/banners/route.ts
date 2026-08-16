/**
 * GET  /api/admin/banners  — list banners (filter: position, active)
 * POST /api/admin/banners  — create banner
 *
 * Query params:
 *   position  – hero | secondary | footer
 *   active    – true | false
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

const VALID_POSITIONS = ["hero", "secondary", "footer"] as const;

// ---------------------------------------------------------------------------
// GET /api/admin/banners
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const position    = searchParams.get("position");
  const activeParam = searchParams.get("active");

  const supabase = getServiceClient();

  let query = supabase
    .from("content_banners")
    .select("*")
    .order("position", { ascending: true })
    .order("display_order", { ascending: true });

  if (position) {
    if (!VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])) {
      return NextResponse.json(
        { success: false, error: `position must be one of: ${VALID_POSITIONS.join(", ")}` },
        { status: 400 }
      );
    }
    query = query.eq("position", position);
  }

  if (activeParam !== null) query = query.eq("is_active", activeParam === "true");

  const { data, error } = await query;

  if (error) {
    console.error("[admin/banners GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch banners", details: error.message },
      { status: 500 }
    );
  }

  // Group by position for convenience
  type BannerRow = { position: string };
  const rows = (data ?? []) as BannerRow[];
  const grouped = {
    hero:      rows.filter(b => b.position === "hero"),
    secondary: rows.filter(b => b.position === "secondary"),
    footer:    rows.filter(b => b.position === "footer"),
  };

  return NextResponse.json({
    success: true,
    data:    data ?? [],
    grouped,
    total:   data?.length ?? 0,
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/banners
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

  const { title, image_url, position } = body;

  if (!title || !image_url || !position) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: title, image_url, position" },
      { status: 400 }
    );
  }

  if (!VALID_POSITIONS.includes(position as (typeof VALID_POSITIONS)[number])) {
    return NextResponse.json(
      { success: false, error: `position must be one of: ${VALID_POSITIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Auto-assign display_order to end of its position group if not provided
  let displayOrder = body.display_order != null ? Number(body.display_order) : 1;
  if (body.display_order == null) {
    const { data: existing } = await supabase
      .from("content_banners")
      .select("display_order")
      .eq("position", position as string)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();
    displayOrder = ((existing?.display_order ?? 0) as number) + 1;
  }

  const { data, error } = await supabase
    .from("content_banners")
    .insert({
      title:         title as string,
      subtitle:      (body.subtitle as string | undefined) ?? null,
      image_url:     image_url as string,
      link_url:      (body.link_url as string | undefined) ?? null,
      position:      position as string,
      display_order: displayOrder,
      is_active:     body.is_active !== undefined ? Boolean(body.is_active) : true,
      start_date:    (body.start_date as string | undefined) ?? null,
      end_date:      (body.end_date as string | undefined) ?? null,
      created_by:    auth.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("[admin/banners POST]", error);
    return NextResponse.json(
      { success: false, error: "Failed to create banner", details: error.message },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "success",
    "banner_created",
    `Banner created: "${title}" (${position})`,
    "cms",
    { banner_id: data.id, position, created_by: auth.userId }
  );

  return NextResponse.json({ success: true, data }, { status: 201 });
}
