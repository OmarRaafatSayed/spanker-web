/**
 * GET    /api/admin/visa-documents/[id]  — get single visa document requirement
 * PATCH  /api/admin/visa-documents/[id]  — update visa document requirement
 * DELETE /api/admin/visa-documents/[id]  — delete visa document requirement
 *
 * NOTE: visa_document_requirements table is not yet deployed to the live database.
 * Returns 503 until the migration runs.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

const NOT_DEPLOYED = { success: false, error: "visa_document_requirements table is pending migration to the live database" };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  await params;
  return NextResponse.json(NOT_DEPLOYED, { status: 503 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  await params;
  return NextResponse.json(NOT_DEPLOYED, { status: 503 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;
  await params;
  return NextResponse.json(NOT_DEPLOYED, { status: 503 });
}
