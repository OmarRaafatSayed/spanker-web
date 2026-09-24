import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({
    success: true,
    data: { booking_id: params.id, status: "cancelled" },
    message: "Booking cancelled successfully",
  });
}