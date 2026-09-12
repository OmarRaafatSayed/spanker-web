/**
 * GET  /api/admin/offers  — list offers (filters: type, active, destination)
 * POST /api/admin/offers  — create offer
 *
 * NOTE: Unified offers table not yet implemented. Use specific tables (hotel_offers, flights, trips).
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

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  return NextResponse.json(
    { success: false, error: "Unified offers not yet implemented. Use /api/admin/hotels, /api/v1/flights, or /api/v1/trips" },
    { status: 501 }
  );
}
