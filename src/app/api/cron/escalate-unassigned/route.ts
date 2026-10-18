/**
 * GET /api/cron/escalate-unassigned
 * Notifies admins about pending bookings with no assigned staff after ESCALATION_HOURS.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';

const ESCALATION_HOURS = Number(process.env.ESCALATION_HOURS ?? 2);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();
  const cutoff = new Date(Date.now() - ESCALATION_HOURS * 60 * 60 * 1000).toISOString();

  const { data: unassigned, error: fetchErr } = await supabase
    .from(TABLES.travelRequests)
    .select('id, booking_reference, vertical')
    .eq('booking_status', 'pending')
    .is('assigned_staff_id', null)
    .lt('created_at', cutoff);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!unassigned?.length) return NextResponse.json({ escalated: 0 });

  const { data: admins } = await supabase
    .from(TABLES.profiles)
    .select('id')
    .eq('role', 'admin');

  if (!admins?.length) return NextResponse.json({ error: 'No admins found' }, { status: 500 });

  await Promise.allSettled(
    admins.flatMap((admin) =>
      unassigned.map((b) =>
        supabase.from(TABLES.portalNotifications).insert({
          customer_id: admin.id ?? '',
          title: '⚠️ حجز بدون تعيين',
          body: `حجز ${b.booking_reference ?? b.id} (${b.vertical ?? ''}) لم يُسند لموظف منذ ${ESCALATION_HOURS} ساعة.`,
          type: 'escalation',
          travel_request_id: b.id,
        })
      )
    )
  );

  return NextResponse.json({ escalated: unassigned.length, admin_count: admins.length });
}
