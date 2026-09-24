import { NextRequest, NextResponse } from 'next/server';
import type { BookingRequest, BookingResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingRequest;

    if (!body.vertical || !body.data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vertical, data' },
        { status: 400 }
      );
    }

    const verticalPrefixes: Record<string, string> = {
      flight: 'FL',
      hotel:  'HT',
      visa:   'VI',
      trip:   'TR',
    };

    const prefix  = verticalPrefixes[body.vertical] ?? 'BK';
    const suffix  = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref     = `SPK-${prefix}-2026-${suffix}`;

    const response: BookingResponse = {
      booking_id: `bk-${Date.now()}`,
      reference:  ref,
      status:     'pending',
      vertical:   body.vertical,
      total_amount: 0,
      currency:   'EGP',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Booking created successfully',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
