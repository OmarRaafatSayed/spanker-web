/**
 * GET /api/cron/send-reminders
 * Sends reminder notifications to customers with pending-payment bookings.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';

const REMINDER_HOURS = Number(process.env.REMINDER_HOURS ?? 4);
const NO_REPEAT_HOURS = 12;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const cutoff = new Date(Date.now() - REMINDER_HOURS * 60 * 60 * 1000).toISOString();
  const recentCutoff = new Date(Date.now() - NO_REPEAT_HOURS * 60 * 60 * 1000).toISOString();

  const { data: pending } = await supabase
    .from(TABLES.travelRequests)
    .select('id, booking_reference, client_user_id, vertical')
    .eq('booking_status', 'pending')
    .lt('created_at', cutoff);

  if (!pending?.length) return NextResponse.json({ reminded: 0 });

  // Skip bookings that already received a reminder recently
  const { data: recentReminders } = await supabase
    .from(TABLES.portalNotifications)
    .select('travel_request_id')
    .eq('type', 'reminder')
    .gt('created_at', recentCutoff);

  const recentSet = new Set((recentReminders ?? []).map((r) => r.travel_request_id));
  const toRemind = pending.filter((b) => !recentSet.has(b.id));

  if (!toRemind.length) return NextResponse.json({ reminded: 0, skipped: pending.length });

  await Promise.allSettled(
    toRemind.map((b) =>
      supabase.from(TABLES.portalNotifications).insert({
        customer_id: b.client_user_id ?? '',
        title: 'تذكير: حجزك في انتظار الدفع',
        body: `حجزك ${b.booking_reference ?? b.id} لا يزال في انتظار اكتمال الدفع. يرجى إتمام العملية لتأكيد الحجز.`,
        type: 'reminder',
        travel_request_id: b.id,
      })
    )
  );

  return NextResponse.json({ reminded: toRemind.length, skipped: pending.length - toRemind.length });
}
