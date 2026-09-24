import { NextRequest, NextResponse } from "next/server";
import { MOCK_PROFILE } from "@/lib/mock/data";

let _profile = { ...MOCK_PROFILE };

export async function GET() {
  return NextResponse.json({ success: true, profile: _profile });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  _profile = {
    ..._profile,
    ...body,
    updated_at: new Date().toISOString(),
  };
  return NextResponse.json({ success: true, profile: _profile });
}