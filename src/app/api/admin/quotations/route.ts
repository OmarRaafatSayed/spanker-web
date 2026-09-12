/**
 * GET  /api/admin/quotations  — list quotations (filters: status, user_id)
 * POST /api/admin/quotations  — create quotation
 *
 * NOTE: Quotations table not yet migrated. This is a stub that returns empty data.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

// ---------------------------------------------------------------------------
// GET /api/admin/quotations
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // Stub: return empty array until quotations table is migrated
  return NextResponse.json({
    success: true,
    data:     [],
    total:    0,
    page:     1,
    limit:    20,
    has_more: false,
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/quotations
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // Stub: quotations feature not yet available
  return NextResponse.json(
    { success: false, error: "Quotations feature not yet available" },
    { status: 501 }
  );
}
