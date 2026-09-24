import { NextRequest, NextResponse } from 'next/server';
import { MOCK_MY_BOOKINGS } from '@/lib/mock/data';
import type { BookingStatus, BookingVertical } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   as BookingStatus | null;
  const vertical = searchParams.get('vertical') as BookingVertical | null;
  const page     = parseInt(searchParams.get('page')  ?? '1');
  const limit    = parseInt(searchParams.get('limit') ?? '10');

  let data = MOCK_MY_BOOKINGS.filter(b => {
    if (status   && b.status   !== status)   return false;
    if (vertical && b.vertical !== vertical) return false;
    return true;
  });

  const total = data.length;
  data = data.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    success: true,
    data,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
}
