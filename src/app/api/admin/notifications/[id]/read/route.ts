/**
 * POST /api/admin/notifications/[id]/read
 * Mark notification as read
 *
 * NOTE: CRM notifications not yet implemented. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "CRM notifications not yet implemented" },
    { status: 501 }
  );
}
