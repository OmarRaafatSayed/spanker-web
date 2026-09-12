/**
 * GET    /api/admin/packages/[id]  — get single package
 * PATCH  /api/admin/packages/[id]  — update package (partial)
 * DELETE /api/admin/packages/[id]  — delete package
 *
 * NOTE: Packages management not yet fully implemented. Use trips table directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Packages management not yet implemented. Use /api/v1/trips" },
    { status: 501 }
  );
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Packages management not yet implemented" },
    { status: 501 }
  );
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Packages management not yet implemented" },
    { status: 501 }
  );
}
