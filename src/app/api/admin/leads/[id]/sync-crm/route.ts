/**
 * POST /api/admin/leads/[id]/sync-crm
 * Push the travel request to the FastAPI CRM as a visa application.
 * 
 * NOTE: CRM sync functionality not yet implemented. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "CRM sync functionality not yet implemented" },
    { status: 501 }
  );
}
