import { NextResponse } from "next/server";
import { MOCK_REQUESTS } from "@/lib/mock/data";

export async function GET() {
  return NextResponse.json({ success: true, data: MOCK_REQUESTS });
}