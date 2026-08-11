/**
 * POST /api/auth/signup
 * Proxies signup to FastAPI and ensures `role: "customer"` is included.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Always force role=customer from the portal
    const payload = { ...body, role: "customer" };

    const res = await fetch(`${BACKEND}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), success: false },
      { status: 502 }
    );
  }
}
