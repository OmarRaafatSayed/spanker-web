import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);
    
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30'); // days
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    
    // === BOOKINGS STATISTICS ===
    
    // Total bookings
    const { count: totalBookings } = await supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact', head: true });
    
    // Bookings in period
    const { count: periodBookings } = await supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', periodStart.toISOString());
    
    // Bookings by status
    const { data: bookingsByStatus } = await supabase
      .from(TABLES.travelRequests)
      .select('booking_status')
      .gte('created_at', periodStart.toISOString());
    
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      expired: 0,
      pending_payment: 0,
      completed: 0,
    };
    
    bookingsByStatus?.forEach((b) => {
      const status = b.booking_status as keyof typeof statusCounts;
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });
    
    // Bookings by vertical
    const { data: bookingsByVertical } = await supabase
      .from(TABLES.travelRequests)
      .select('vertical')
      .gte('created_at', periodStart.toISOString());
    
    const verticalCounts = {
      flight: 0,
      hotel: 0,
      visa: 0,
      trip: 0,
    };
    
    bookingsByVertical?.forEach((b) => {
      const vertical = b.vertical as keyof typeof verticalCounts;
      if (vertical in verticalCounts) {
        verticalCounts[vertical]++;
      }
    });
    
    // === REVENUE STATISTICS ===
    
    const { data: revenueData } = await supabase
      .from(TABLES.travelRequests)
      .select('total_amount, booking_status, created_at')
      .gte('created_at', periodStart.toISOString());
    
    const totalRevenue = revenueData
      ?.filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    const pendingRevenue = revenueData
      ?.filter(b => b.booking_status === 'pending' || b.booking_status === 'pending_payment')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    // === DOCUMENTS STATISTICS ===
    
    const { count: pendingDocuments } = await supabase
      .from(TABLES.customerDocuments)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedDocuments } = await supabase
      .from(TABLES.customerDocuments)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')
      .gte('created_at', periodStart.toISOString());

    const { count: rejectedDocuments } = await supabase
      .from(TABLES.customerDocuments)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')
      .gte('created_at', periodStart.toISOString());
    
    // === RECENT ACTIVITY ===
    
    const { data: recentBookings } = await supabase
      .from(TABLES.travelRequests)
      .select(`
        id,
        booking_reference,
        vertical,
        booking_status,
        total_amount,
        created_at,
        profiles!travel_requests_client_user_id_fkey(
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // === CUSTOMERS STATISTICS ===
    
    const { count: totalCustomers } = await supabase
      .from(TABLES.profiles)
      .select('*', { count: 'exact', head: true })
      .in('role', ['client', 'user', 'customer']);
    
    const { count: newCustomers } = await supabase
      .from(TABLES.profiles)
      .select('*', { count: 'exact', head: true })
      .in('role', ['client', 'user', 'customer'])
      .gte('created_at', periodStart.toISOString());
    
    // === DAILY BOOKINGS TREND (last 7 days) ===
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });
    
    const dailyTrend = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const { count } = await supabase
          .from(TABLES.travelRequests)
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDay.toISOString());
        
        return {
          date: date.toISOString().split('T')[0],
          count: count || 0,
        };
      })
    );
    
    return successResponse({
      period: {
        days: period,
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      bookings: {
        total: totalBookings || 0,
        inPeriod: periodBookings || 0,
        byStatus: statusCounts,
        byVertical: verticalCounts,
        dailyTrend,
      },
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        currency: 'EGP',
      },
      documents: {
        pending: pendingDocuments || 0,
        approved: approvedDocuments || 0,
        rejected: rejectedDocuments || 0,
      },
      customers: {
        total: totalCustomers || 0,
        new: newCustomers || 0,
      },
      recentActivity: recentBookings || [],
    });
  } catch (err) {
    console.error('[Dashboard API Error]:', err);
    return errorResponse(err as Error);
  }
}
