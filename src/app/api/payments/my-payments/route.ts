import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: [
      {
        id: "pay-001",
        booking_id: "booking-001",
        amount: 10800,
        currency: "EGP",
        status: "paid",
        method: "bank_transfer",
        created_at: "2026-09-12T14:00:00Z",
      },
    ],
  });
}