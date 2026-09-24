import { NextResponse } from "next/server";
import { MOCK_REQUESTS } from "@/lib/mock/data";

export async function GET() {
  const visaRequests = MOCK_REQUESTS.filter(r => r.request_type === "visa");
  return NextResponse.json({ success: true, data: visaRequests });
}