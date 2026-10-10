import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);
    
    const { id } = await params;
    
    // Get customer profile
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.profiles)
      .select('*')
      .eq('id', id)
      .single();
    
    if (profileError || !profile) {
      return notFoundResponse('Customer');
    }
    
    // Get all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from(TABLES.travelRequests)
      .select(`
        *,
        flight_booking_details(*),
        hotel_booking_details(*),
        visa_booking_details(*),
        trip_booking_details(*)
      `)
      .eq('client_user_id', profile.user_id)
      .order('created_at', { ascending: false });
    
    if (bookingsError) throw bookingsError;
    
    // Get communications
    const { data: communications, error: commsError } = await supabase
      .from(TABLES.customerCommunications)
      .select('*')
      .eq('customer_id', profile.id)
      .order('sent_at', { ascending: false })
      .limit(20);
    
    if (commsError) throw commsError;
    
    // Get documents
    const { data: documents, error: docsError } = await supabase
      .from(TABLES.customerDocuments)
      .select('*')
      .eq('customer_id', profile.id)
      .order('uploaded_at', { ascending: false });
    
    if (docsError) throw docsError;
    
    return successResponse({
      customer: profile,
      bookings: bookings || [],
      communications: communications || [],
      documents: documents || [],
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
