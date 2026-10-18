import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30', 10);
    const staffId = searchParams.get('staff_id');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Build base query for staff members
    let staffQuery = supabase
      .from(TABLES.profiles)
      .select('id, full_name, email, role')
      .in('role', ['staff', 'admin']);

    if (staffId) {
      staffQuery = staffQuery.eq('id', staffId);
    }

    const { data: staffMembers, error: staffError } = await staffQuery;

    if (staffError) throw new AppError(staffError.message, 500);

    // Get performance metrics for each staff member
    const performanceData = await Promise.all(
      (staffMembers || []).map(async (staff) => {
        // Get bookings assigned to this staff member
        const { data: assignments, error: assignError } = await supabase
          .from(TABLES.travelRequests)
          .select('id, booking_status, total_amount, created_at, updated_at')
          .eq('assigned_staff_id', staff.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (assignError) {
          console.error('Error fetching assignments:', assignError);
          return null;
        }

        const bookings = assignments || [];

        // Calculate metrics
        const totalAssigned = bookings.length;
        const completed = bookings.filter((b) => b.booking_status === 'completed').length;
        const confirmed = bookings.filter((b) => b.booking_status === 'confirmed').length;
        const cancelled = bookings.filter((b) => b.booking_status === 'cancelled').length;
        const pending = bookings.filter((b) => b.booking_status === 'pending').length;

        // Calculate average response time (time from creation to first status change)
        const { data: statusLogs, error: logsError } = await supabase
          .from(TABLES.portalStatusLog)
          .select('request_id, created_at')
          .eq('changed_by', staff.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true });

        let avgResponseTimeHours = 0;
        if (!logsError && statusLogs && statusLogs.length > 0) {
          // Group by request_id and get first log for each
          const firstLogs = statusLogs.reduce((acc, log) => {
            if (!acc[log.request_id]) {
              acc[log.request_id] = log;
            }
            return acc;
          }, {} as Record<string, any>);

          const responseTimes = await Promise.all(
            Object.entries(firstLogs).map(async ([requestId, log]) => {
              const { data: booking } = await supabase
                .from(TABLES.travelRequests)
                .select('created_at')
                .eq('id', requestId)
                .single();

              if (booking && booking.created_at && log.created_at) {
                const createdAt = new Date(booking.created_at);
                const respondedAt = new Date(log.created_at);
                const diffHours = (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                return diffHours;
              }
              return 0;
            })
          );

          const validTimes = responseTimes.filter((t) => t > 0);
          if (validTimes.length > 0) {
            avgResponseTimeHours = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
          }
        }

        // Calculate revenue handled
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

        // Calculate completion rate
        const completionRate = totalAssigned > 0 ? ((completed + confirmed) / totalAssigned) * 100 : 0;

        // Calculate cancellation rate
        const cancellationRate = totalAssigned > 0 ? (cancelled / totalAssigned) * 100 : 0;

        return {
          staff_id: staff.id,
          staff_name: staff.full_name || staff.email,
          staff_email: staff.email,
          role: staff.role,
          metrics: {
            total_assigned: totalAssigned,
            completed: completed,
            confirmed: confirmed,
            cancelled: cancelled,
            pending: pending,
            completion_rate: Math.round(completionRate * 10) / 10,
            cancellation_rate: Math.round(cancellationRate * 10) / 10,
            avg_response_time_hours: Math.round(avgResponseTimeHours * 10) / 10,
            total_revenue: totalRevenue,
          },
        };
      })
    );

    // Filter out null results and sort by total assigned
    const validPerformance = performanceData
      .filter((p) => p !== null)
      .sort((a, b) => b!.metrics.total_assigned - a!.metrics.total_assigned);

    // Calculate team totals
    const teamTotals = validPerformance.reduce(
      (acc, staff) => ({
        total_assigned: acc.total_assigned + staff!.metrics.total_assigned,
        completed: acc.completed + staff!.metrics.completed,
        confirmed: acc.confirmed + staff!.metrics.confirmed,
        cancelled: acc.cancelled + staff!.metrics.cancelled,
        pending: acc.pending + staff!.metrics.pending,
        total_revenue: acc.total_revenue + staff!.metrics.total_revenue,
      }),
      {
        total_assigned: 0,
        completed: 0,
        confirmed: 0,
        cancelled: 0,
        pending: 0,
        total_revenue: 0,
      }
    );

    return successResponse({
      period: {
        days: period,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      staff_performance: validPerformance,
      team_totals: teamTotals,
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
