import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/modules/admin/services/admin-auth";

/**
 * NOTE: The visa_types table is defined in the database types but has not been
 * deployed to the live Supabase project yet. These handlers return graceful
 * stubs with auth enforcement until the migration runs.
 */

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // visa_types table not yet deployed — return empty list
  return NextResponse.json({
    success: true,
    data: [],
    total: 0,
    notice: "visa_types table is pending migration to the live database",
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { country_code, country_name, visa_name, duration_days, category, price } = body;

  if (!country_code || !country_name || !visa_name || !duration_days || !category || price == null) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields: country_code, country_name, visa_name, duration_days, category, price",
      },
      { status: 400 }
    );
  }

  // visa_types table not yet deployed
  return NextResponse.json(
    { success: false, error: "visa_types table is pending migration to the live database" },
    { status: 503 }
  );
}
