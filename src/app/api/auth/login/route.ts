import { NextRequest, NextResponse } from "next/server";
import { MOCK_USER } from "@/lib/mock/data";

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    user: {
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      first_name: MOCK_USER.user_metadata.first_name,
      last_name: MOCK_USER.user_metadata.last_name,
    },
    session: {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });
}