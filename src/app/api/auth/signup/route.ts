import { NextRequest, NextResponse } from "next/server";
import { MOCK_USER } from "@/lib/mock/data";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    user: {
      id: MOCK_USER.id,
      email: body.email ?? MOCK_USER.email,
      first_name: body.first_name ?? "Demo",
      last_name: body.last_name ?? "User",
      phone: body.phone,
    },
    session: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });
}