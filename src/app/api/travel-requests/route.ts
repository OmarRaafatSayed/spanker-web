import { NextRequest, NextResponse } from "next/server";
import { MOCK_REQUESTS } from "@/lib/mock/data";

let _requests = [...MOCK_REQUESTS];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newReq = {
    id: "req-" + Date.now(),
    customer_id: "mock-user-001",
    status: "new",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    num_travelers: 1,
    ...body,
  };
  _requests = [newReq, ..._requests];
  return NextResponse.json({ success: true, data: newReq }, { status: 201 });
}