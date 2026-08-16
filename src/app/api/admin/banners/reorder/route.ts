/**
 * PATCH /api/admin/banners/reorder
 * Batch-update display_order for multiple banners in one request.
 * Body: { updates: { id: string, display_order: number }[] }
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

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const updates = body.updates;

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json(
      { success: false, error: "updates must be a non-empty array of { id, display_order }" },
      { status: 400 }
    );
  }

  // Validate each entry
  for (const item of updates) {
    if (
      typeof item !== "object" ||
      typeof (item as Record<string, unknown>).id !== "string" ||
      typeof (item as Record<string, unknown>).display_order !== "number"
    ) {
      return NextResponse.json(
        { success: false, error: "Each update must have { id: string, display_order: number }" },
        { status: 400 }
      );
    }
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  type SingleResult = { data: { id: string; display_order: number } | null; error: { message: string } | null };

  const results = await Promise.all(
    (updates as Array<{ id: string; display_order: number }>).map(({ id, display_order }) =>
      supabase
        .from("content_banners")
        .update({ display_order, updated_at: now })
        .eq("id", id)
        .select("id, display_order")
        .single() as Promise<SingleResult>
    )
  );

  const errors = results
    .map((r: SingleResult, i: number) =>
      r.error ? { id: (updates as Array<{ id: string }>)[i].id, error: r.error.message } : null
    )
    .filter(Boolean);

  if (errors.length > 0) {
    console.error("[admin/banners/reorder PATCH]", errors);
    return NextResponse.json(
      { success: false, error: "Some updates failed", details: errors },
      { status: 500 }
    );
  }

  await logToSystemLogs(
    "info",
    "banners_reordered",
    `Reordered ${updates.length} banners`,
    "cms",
    { count: updates.length, reordered_by: auth.userId }
  );

  return NextResponse.json({
    success: true,
    data: results.map((r: SingleResult) => r.data),
  });
}
