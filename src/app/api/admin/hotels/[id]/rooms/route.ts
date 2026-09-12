/**
 * GET  /api/admin/hotels/[id]/rooms  — list rooms for hotel
 * POST /api/admin/hotels/[id]/rooms  — create new room
 *
 * NOTE: Hotel rooms management not yet implemented. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    success: true,
    data: []
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Hotel rooms management not yet implemented" },
    { status: 501 }
  );
}
