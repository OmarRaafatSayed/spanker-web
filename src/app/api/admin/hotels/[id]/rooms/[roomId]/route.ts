/**
 * GET    /api/admin/hotels/[id]/rooms/[roomId]  — get single room
 * PATCH  /api/admin/hotels/[id]/rooms/[roomId]  — update room
 * DELETE /api/admin/hotels/[id]/rooms/[roomId]  — delete room
 *
 * NOTE: Hotel rooms management not yet implemented. This is a stub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Hotel rooms management not yet implemented" },
    { status: 501 }
  );
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Hotel rooms management not yet implemented" },
    { status: 501 }
  );
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Hotel rooms management not yet implemented" },
    { status: 501 }
  );
}
