import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    // Parse query params (same as the bookings list filters)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vertical = searchParams.get('vertical');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const amountMin = searchParams.get('amount_min');
    const amountMax = searchParams.get('amount_max');
    const assignedTo = searchParams.get('assigned_to');
    const search = searchParams.get('search');
    const format = searchParams.get('format') || 'xlsx'; // xlsx or csv

    // Build query - fetch all matching records (no pagination for export)
    let query = supabase
      .from(TABLES.travelRequests)
      .select(`
        *,
        client:profiles!travel_requests_client_user_id_fkey(full_name, email, phone),
        assigned_staff:profiles!travel_requests_assigned_to_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Apply same filters as the list view
    if (status) query = query.eq('booking_status', status);
    if (vertical) query = query.eq('vertical', vertical);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }
    if (amountMin) query = query.gte('total_amount', parseFloat(amountMin));
    if (amountMax) query = query.lte('total_amount', parseFloat(amountMax));
    if (assignedTo) {
      if (assignedTo === '_unassigned') {
        query = query.is('assigned_staff_id', null);
      } else {
        query = query.eq('assigned_staff_id', assignedTo);
      }
    }
    if (search) query = query.ilike('booking_reference', `%${search}%`);

    const { data: bookings, error } = await query;

    if (error) throw new AppError(error.message, 500);
    if (!bookings || bookings.length === 0) {
      throw new AppError('No bookings found for export', 404);
    }

    // Transform data for export
    const exportData = bookings.map((booking: any) => ({
      'Reference Number': booking.booking_reference,
      'Type': booking.vertical,
      'Status': booking.booking_status,
      'Customer Name': booking.client?.full_name || 'N/A',
      'Customer Email': booking.client?.email || 'N/A',
      'Customer Phone': booking.client?.phone || 'N/A',
      'Total Amount (EGP)': booking.total_amount || 0,
      'Assigned To': booking.assigned_staff?.full_name || 'Unassigned',
      'Created At': new Date(booking.created_at).toLocaleString('en-US'),
      'Updated At': new Date(booking.updated_at).toLocaleString('en-US'),
      'Expires At': booking.expires_at
        ? new Date(booking.expires_at).toLocaleString('en-US')
        : 'N/A',
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Reference Number
      { wch: 10 }, // Type
      { wch: 12 }, // Status
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 15 }, // Total Amount
      { wch: 15 }, // Paid Amount
      { wch: 20 }, // Assigned To
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Expires At
    ];
    worksheet['!cols'] = columnWidths;

    // Generate file
    let uint8: Uint8Array;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      uint8 = new TextEncoder().encode(csv);
      contentType = 'text/csv';
      filename = `bookings-export-${timestamp}.csv`;
    } else {
      uint8 = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array;
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `bookings-export-${timestamp}.xlsx`;
    }

    return new NextResponse(uint8 as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': uint8.byteLength.toString(),
      },
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
