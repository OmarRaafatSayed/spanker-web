/**
 * GET    /api/admin/offers/[id]  — get single offer
 * PATCH  /api/admin/offers/[id]  — update offer
 * DELETE /api/admin/offers/[id]  — delete offer
 *
 * NOTE: Unified offers table not yet implemented.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Unified offers not yet implemented" },
    { status: 501 }
  );
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Unified offers not yet implemented" },
    { status: 501 }
  );
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Unified offers not yet implemented" },
    { status: 501 }
  );
}
