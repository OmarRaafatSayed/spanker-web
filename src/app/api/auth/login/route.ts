/**
 * POST /api/auth/login
 * Thin server-side proxy to FastAPI login.
 * FIXED: Uses BACKEND_INTERNAL_URL (server-side) not NEXT_PUBLIC_API_URL (browser-only).
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    const res = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
