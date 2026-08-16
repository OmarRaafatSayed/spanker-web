/**
 * GET    /api/admin/logs  — paginated system logs with filters
 * DELETE /api/admin/logs  — purge logs older than N days (admin only, requires ?confirm=true)
 *
 * GET query params:
 *   level      – info | success | warning | error
 *   source     – webhook | crm | cms | auth | system
 *   date_from  – ISO date string
 *   date_to    – ISO date string
 *   search     – free-text match on event or details
 *   page       – default 1
 *   limit      – default 50, max 200
 *
 * DELETE query params:
 *   days       – purge logs older than N days (required)
 *   confirm    – must be "true" (safety gate)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth, requireAdminOnly } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// GET /api/admin/logs
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const level    = searchParams.get("level");
  const source   = searchParams.get("source");
  const dateFrom = searchParams.get("date_from");
  const dateTo   = searchParams.get("date_to");
  const search   = searchParams.get("search");
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset   = (page - 1) * limit;

  const VALID_LEVELS  = ["info", "success", "warning", "error"];
  const VALID_SOURCES = ["webhook", "crm", "cms", "auth", "system"];

  if (level && !VALID_LEVELS.includes(level)) {
    return NextResponse.json(
      { success: false, error: `level must be one of: ${VALID_LEVELS.join(", ")}` },
      { status: 400 }
    );
  }

  if (source && !VALID_SOURCES.includes(source)) {
    return NextResponse.json(
      { success: false, error: `source must be one of: ${VALID_SOURCES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  let query = supabase
    .from("system_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (level)    query = query.eq("level", level);
  if (source)   query = query.eq("source", source);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo)   query = query.lte("created_at", dateTo);

  // Full-text search on event name or details
  if (search) {
    query = query.or(`event.ilike.%${search}%,details.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/logs GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logs", details: error.message },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  return NextResponse.json({
    success: true,
    data:    data ?? [],
    total,
    page,
    limit,
    has_more: offset + limit < total,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/logs  (admin only)
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminOnly(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const daysParam = searchParams.get("days");
  const confirm   = searchParams.get("confirm");

  if (confirm !== "true") {
    return NextResponse.json(
      { success: false, error: "Safety gate: add ?confirm=true to confirm log purge" },
      { status: 400 }
    );
  }

  const days = parseInt(daysParam ?? "", 10);
  if (isNaN(days) || days < 1) {
    return NextResponse.json(
      { success: false, error: "days parameter must be a positive integer (e.g. ?days=90)" },
      { status: 400 }
    );
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const supabase = getServiceClient();

  // Count before delete
  const { count: beforeCount } = await supabase
    .from("system_logs")
    .select("*", { count: "exact", head: true })
    .lt("created_at", cutoff);

  const { error } = await supabase
    .from("system_logs")
    .delete()
    .lt("created_at", cutoff);

  if (error) {
    console.error("[admin/logs DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Failed to purge logs", details: error.message },
      { status: 500 }
    );
  }

  // Log the purge itself (new entry, won't be purged)
  await supabase.from("system_logs").insert({
    level:   "warning",
    event:   "logs_purged",
    details: `Purged ${beforeCount ?? "?"} logs older than ${days} days (cutoff: ${cutoff})`,
    source:  "system",
    metadata: { days, cutoff, purged_by: auth.userId, count: beforeCount },
  });

  return NextResponse.json({
    success: true,
    data: {
      purged_count: beforeCount ?? 0,
      days,
      cutoff,
    },
  });
}
