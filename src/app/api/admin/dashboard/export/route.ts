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

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30', 10);
    const format = searchParams.get('format') || 'xlsx';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Fetch bookings in period
    const { data: bookings, error } = await supabase
      .from(TABLES.travelRequests)
      .select(`
        *,
        client:profiles!travel_requests_client_user_id_fkey(full_name, email, phone)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    // Calculate statistics
    const stats = {
      totalBookings: bookings?.length || 0,
      byStatus: {
        pending: bookings?.filter((b) => b.booking_status === 'pending').length || 0,
        confirmed: bookings?.filter((b) => b.booking_status === 'confirmed').length || 0,
        cancelled: bookings?.filter((b) => b.booking_status === 'cancelled').length || 0,
        completed: bookings?.filter((b) => b.booking_status === 'completed').length || 0,
      },
      byVertical: {
        flight: bookings?.filter((b) => b.vertical === 'flight').length || 0,
        hotel: bookings?.filter((b) => b.vertical === 'hotel').length || 0,
        visa: bookings?.filter((b) => b.vertical === 'visa').length || 0,
        trip: bookings?.filter((b) => b.vertical === 'trip').length || 0,
      },
      revenue: {
        total: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
        paid: 0,
        pending: 0,
      },
    };

    // Create summary sheet
    const summaryData = [
      { Metric: 'Period', Value: `${period} days` },
      { Metric: 'Start Date', Value: startDate.toLocaleDateString('en-US') },
      { Metric: 'End Date', Value: endDate.toLocaleDateString('en-US') },
      { Metric: '', Value: '' },
      { Metric: 'Total Bookings', Value: stats.totalBookings },
      { Metric: 'Pending Bookings', Value: stats.byStatus.pending },
      { Metric: 'Confirmed Bookings', Value: stats.byStatus.confirmed },
      { Metric: 'Cancelled Bookings', Value: stats.byStatus.cancelled },
      { Metric: 'Completed Bookings', Value: stats.byStatus.completed },
      { Metric: '', Value: '' },
      { Metric: 'Flight Bookings', Value: stats.byVertical.flight },
      { Metric: 'Hotel Bookings', Value: stats.byVertical.hotel },
      { Metric: 'Visa Applications', Value: stats.byVertical.visa },
      { Metric: 'Trip Bookings', Value: stats.byVertical.trip },
      { Metric: '', Value: '' },
      { Metric: 'Total Revenue (EGP)', Value: stats.revenue.total },
      { Metric: 'Paid Amount (EGP)', Value: stats.revenue.paid },
      { Metric: 'Pending Payment (EGP)', Value: stats.revenue.pending },
    ];

    // Create detailed bookings sheet
    const detailedData = (bookings || []).map((booking: any) => ({
      'Reference': booking.booking_reference,
      'Type': booking.vertical,
      'Status': booking.booking_status,
      'Customer': booking.client?.full_name || 'N/A',
      'Email': booking.client?.email || 'N/A',
      'Phone': booking.client?.phone || 'N/A',
      'Total Amount': booking.total_amount || 0,
      'Created At': new Date(booking.created_at).toLocaleString('en-US'),
    }));

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    detailedSheet['!cols'] = [
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Bookings');

    // Generate file
    let uint8: Uint8Array;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(summarySheet);
      uint8 = new TextEncoder().encode(csv);
      contentType = 'text/csv';
      filename = `dashboard-report-${timestamp}.csv`;
    } else {
      uint8 = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array;
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `dashboard-report-${timestamp}.xlsx`;
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
