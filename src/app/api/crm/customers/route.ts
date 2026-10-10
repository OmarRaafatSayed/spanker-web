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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from(TABLES.profiles)
      .select('*', { count: 'exact' })
      .in('role', ['client', 'user', 'customer'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[CRM Customers API Error]:', error);
      throw error;
    }
    
    // Get booking counts separately for each customer
    const customersWithBookings = await Promise.all(
      (data || []).map(async (customer) => {
        const { count: bookingCount } = await supabase
          .from(TABLES.travelRequests)
          .select('*', { count: 'exact', head: true })
          .eq('client_user_id', customer.user_id);
        
        return {
          ...customer,
          booking_count: bookingCount || 0,
        };
      })
    );
    
    return successResponse({
      customers: customersWithBookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
