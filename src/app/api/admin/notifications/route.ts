/**
 * GET /api/admin/notifications
 * List admin/staff notifications
 *
 * NOTE: CRM notifications not yet implemented. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // Stub: return empty array
  return NextResponse.json({
    success: true,
    data: [],
    total: 0,
  });
}
