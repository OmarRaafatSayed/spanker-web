/**
 * GET /api/cron/expire-bookings
 * Marks pending bookings older than BOOKING_EXPIRY_HOURS as expired.
 * Protected by CRON_SECRET env var.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';

const EXPIRY_HOURS = Number(process.env.BOOKING_EXPIRY_HOURS ?? 24);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: stale, error: fetchErr } = await supabase
    .from(TABLES.travelRequests)
    .select('id, booking_reference, client_user_id')
    .eq('booking_status', 'pending')
    .lt('created_at', cutoff);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!stale?.length) return NextResponse.json({ expired: 0 });

  const ids = stale.map((b) => b.id);

  const { error: updateErr } = await supabase
    .from(TABLES.travelRequests)
    .update({ booking_status: 'expired', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Fire-and-forget: audit logs + notifications
  await Promise.allSettled(
    stale.flatMap((b) => [
      supabase.from(TABLES.portalStatusLog).insert({
        request_id: b.id,
        customer_id: b.client_user_id ?? '',
        from_status: 'pending',
        to_status: 'expired',
        note: `Auto-expired after ${EXPIRY_HOURS}h`,
      }),
      supabase.from(TABLES.portalNotifications).insert({
        customer_id: b.client_user_id ?? '',
        title: 'انتهت صلاحية الحجز',
        body: `انتهت صلاحية حجزك ${b.booking_reference ?? b.id} بسبب عدم اكتمال الدفع خلال ${EXPIRY_HOURS} ساعة.`,
        type: 'booking_expired',
        travel_request_id: b.id,
      }),
    ])
  );

  return NextResponse.json({ expired: stale.length, ids });
}
