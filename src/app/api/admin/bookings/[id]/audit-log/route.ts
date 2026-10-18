import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';

/**
 * GET /api/admin/bookings/[id]/audit-log
 * Get complete audit log for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);
    
    const { id } = await params;
    
    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_reference, created_at')
      .eq('id', id)
      .single();
    
    if (bookingError || !booking) {
      return notFoundResponse('Booking');
    }
    
    // Get status log
    const { data: statusLog, error: logError } = await supabase
      .from(TABLES.portalStatusLog)
      .select(`
        *,
        profiles!portal_status_log_changed_by_fkey(
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('travel_request_id', id)
      .order('changed_at', { ascending: false });
    
    if (logError) {
      throw logError;
    }
    
    // Build comprehensive log entries
    const logEntries = [
      // Booking creation
      {
        id: 'creation',
        action: 'booking_created',
        timestamp: booking.created_at,
        actor: 'System',
        details: {
          message: 'تم إنشاء الحجز',
          reference: booking.booking_reference,
        },
      },
      // Status changes from portal_status_log
      ...(statusLog || []).map((log: any) => ({
        id: log.id,
        action: 'status_changed',
        timestamp: log.changed_at,
        actor: log.profiles
          ? `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim() ||
            log.profiles.email
          : 'موظف',
        actorRole: log.profiles?.role || null,
        details: {
          from: log.from_status,
          to: log.to_status,
          notes: log.notes,
        },
      })),
    ];
    
    // Sort by timestamp descending
    logEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return successResponse({
      booking_id: id,
      booking_reference: booking.booking_reference,
      log_entries: logEntries,
      total_entries: logEntries.length,
    });
  } catch (err) {
    console.error('[Audit Log API Error]:', err);
    return errorResponse(err as Error);
  }
}
