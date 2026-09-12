/**
 * GET /api/admin/quotations/[id]  — single quotation detail
 *
 * NOTE: Quotations table not yet migrated. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Quotations feature not yet available" },
    { status: 501 }
  );
}
