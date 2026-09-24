import { NextResponse } from "next/server";
import { MOCK_ADMIN_STATS } from "@/lib/mock/data";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_ADMIN_STATS });
}