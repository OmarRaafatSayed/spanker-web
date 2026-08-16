/**
 * GET /api/admin/notifications
 * List admin/staff notifications from crm_notifications, unread first.
 *
 * Query params:
 *   unread  – true → only unread notifications
 *   limit   – default 20, max 50
 *
 * NOTE: crm_notifications.user_id references public.users (CRM users table),
 * not auth.users. Admin sees all notifications for all users.
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
  const unreadOnly = searchParams.get("unread") === "true";
  const limit      = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  const supabase = getServiceClient();

  let query = supabase
    .from("crm_notifications")
    .select(
      `
      *,
      users!crm_notifications_user_id_fkey (
        id, email, first_name, last_name
      )
      `,
      { count: "exact" }
    )
    .order("is_read", { ascending: true })      // unread first
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin/notifications GET]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications", details: error.message },
      { status: 500 }
    );
  }

  const unreadCount = (data ?? []).filter(
    (n: Record<string, unknown>) => !n.is_read
  ).length;

  return NextResponse.json({
    success: true,
    data:         data ?? [],
    total:        count ?? 0,
    unread_count: unreadCount,
  });
}
