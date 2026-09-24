import { NextRequest, NextResponse } from "next/server";
import { MOCK_VISAS } from "@/lib/mock/data";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const visa = MOCK_VISAS.find(v => v.id === params.id) ?? MOCK_VISAS[0];
  if (!visa) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: visa });
}