/**
 * admin-auth.ts
 * =============
 * Server-side role enforcement for all /api/admin/* routes.
 *
 * Usage:
 *   const auth = await requireAdminAuth(request);
 *   if (!auth.ok) return auth.response;
 *   // auth.userId, auth.role are available
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Service-role client (bypasses RLS — for server-side admin checks only)
// ---------------------------------------------------------------------------
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AdminRole = "admin" | "staff";

export type AdminAuthSuccess = {
  ok: true;
  userId: string;
  role: AdminRole;
};

export type AdminAuthFailure = {
  ok: false;
  response: NextResponse;
};

export type AdminAuthResult = AdminAuthSuccess | AdminAuthFailure;

// ---------------------------------------------------------------------------
// Main guard — checks admin or staff role
// ---------------------------------------------------------------------------
export async function requireAdminAuth(req: NextRequest): Promise<AdminAuthResult> {
  return _checkRole(req, ["admin", "staff"]);
}

// ---------------------------------------------------------------------------
// Stricter guard — admin-only (for role changes, log purge, etc.)
// ---------------------------------------------------------------------------
export async function requireAdminOnly(req: NextRequest): Promise<AdminAuthResult> {
  return _checkRole(req, ["admin"]);
}

// ---------------------------------------------------------------------------
// Internal implementation
// ---------------------------------------------------------------------------
async function _checkRole(
  req: NextRequest,
  allowed: AdminRole[]
): Promise<AdminAuthResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return _fail(401, "Missing authorization token");
  }

  const supabase = getServiceClient();

  // Verify JWT with Supabase auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return _fail(401, "Invalid or expired token");
  }

  // Look up role in profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return _fail(403, "Profile not found");
  }

  const role = profile.role as AdminRole;

  if (!allowed.includes(role)) {
    return _fail(403, `Access denied. Required role: ${allowed.join(" or ")}`);
  }

  return { ok: true, userId: user.id, role };
}

function _fail(status: number, message: string): AdminAuthFailure {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error: message }, { status }),
  };
}
