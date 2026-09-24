import { NextRequest, NextResponse } from "next/server";
import { MOCK_MY_BOOKINGS } from "@/lib/mock/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const booking = MOCK_MY_BOOKINGS.find(b => b.booking_id === params.id)
    ?? MOCK_MY_BOOKINGS[0];
  if (!booking) return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: booking });
}