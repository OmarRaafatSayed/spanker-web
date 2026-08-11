/**
 * GET /api/travel-requests/my-requests
 * Returns travel requests for the authenticated user.
 * Uses service_role to bypass RLS — user identity from JWT body param.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Get user id from query param or Authorization header
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    // Try to extract from localStorage-style JWT in Authorization header
    if (!userId) {
      const auth = req.headers.get("authorization") ?? "";
      if (auth.startsWith("Bearer ")) {
        try {
          const payload = JSON.parse(
            Buffer.from(auth.slice(7).split(".")[1], "base64").toString()
          ) as { sub?: string };
          userId = payload.sub ?? null;
        } catch { /* ignore */ }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getServiceClient();

    const { data, error } = await db
      .from("travel_requests")
      .select("*")
      .eq("client_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
