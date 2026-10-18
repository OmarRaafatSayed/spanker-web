import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

/**
 * GET   /api/admin/visa-types/[id]  — get single visa type
 * POST  /api/admin/visa-types/[id]  — update visa type
 * DELETE /api/admin/visa-types/[id] — delete visa type
 *
 * NOTE: visa_types table not yet deployed to the live database.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  await params; // consume params

  return NextResponse.json(
    { success: false, error: "visa_types table is pending migration to the live database" },
    { status: 503 }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  await params;

  return NextResponse.json(
    { success: false, error: "visa_types table is pending migration to the live database" },
    { status: 503 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  await params;

  return NextResponse.json(
    { success: false, error: "visa_types table is pending migration to the live database" },
    { status: 503 }
  );
}
