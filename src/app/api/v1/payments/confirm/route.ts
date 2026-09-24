import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    data: { payment_id: "pay-" + Date.now(), status: "paid" },
    message: "Payment confirmed",
  });
}