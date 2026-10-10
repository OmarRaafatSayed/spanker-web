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
    const period = searchParams.get('period') || '30'; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));
    
    // Total customers (include both 'client' and 'user' roles)
    const { count: totalCustomers } = await supabase
      .from(TABLES.profiles)
      .select('*', { count: 'exact', head: true })
      .in('role', ['client', 'user', 'customer']);
    
    // New customers in period
    const { count: newCustomers } = await supabase
      .from(TABLES.profiles)
      .select('*', { count: 'exact', head: true })
      .in('role', ['client', 'user', 'customer'])
      .gte('created_at', daysAgo.toISOString());
    
    // Total bookings
    const { count: totalBookings } = await supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact', head: true });
    
    // Pending bookings
    const { count: pendingBookings } = await supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact', head: true })
      .eq('booking_status', 'pending');
    
    // Confirmed bookings
    const { count: confirmedBookings } = await supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact', head: true })
      .eq('booking_status', 'confirmed');
    
    // Bookings by vertical
    const { data: bookingsByVertical } = await supabase
      .from(TABLES.travelRequests)
      .select('vertical')
      .gte('created_at', daysAgo.toISOString());
    
    const verticalCounts = {
      flight: 0,
      hotel: 0,
      visa: 0,
      trip: 0,
    };
    
    bookingsByVertical?.forEach((booking) => {
      const vertical = booking.vertical as keyof typeof verticalCounts;
      if (vertical in verticalCounts) {
        verticalCounts[vertical]++;
      }
    });
    
    // Recent bookings
    const { data: recentBookings } = await supabase
      .from(TABLES.travelRequests)
      .select(`
        *,
        profiles!travel_requests_client_user_id_fkey(id, email, first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Revenue (sum of total_amount)
    const { data: revenueData } = await supabase
      .from(TABLES.travelRequests)
      .select('total_amount, created_at')
      .eq('booking_status', 'confirmed')
      .gte('created_at', daysAgo.toISOString());
    
    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.total_amount || 0), 0) || 0;
    
    return successResponse({
      stats: {
        totalCustomers: totalCustomers || 0,
        newCustomers: newCustomers || 0,
        totalBookings: totalBookings || 0,
        pendingBookings: pendingBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        totalRevenue,
      },
      bookingsByVertical: verticalCounts,
      recentBookings: recentBookings || [],
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
