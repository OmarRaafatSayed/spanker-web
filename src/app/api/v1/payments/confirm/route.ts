import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response';
import { handleRPCError, ValidationError, AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import type { ConfirmPaymentRequest } from '@/types/api';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const staff = await requireStaff(['admin', 'agent']);
    const body = (await request.json()) as ConfirmPaymentRequest;

    if (!body.payment_id) return validationErrorResponse('payment_id is required');

    const supabase = await createServerClient();

    const { data: payment, error: fetchError } = await supabase
      .from(TABLES.paymentRecords)
      .select('id, payment_method, status, booking_id')
      .eq('id', body.payment_id)
      .maybeSingle();

    if (fetchError) throw new AppError(`Failed to fetch payment: ${fetchError.message}`, 500);
    if (!payment) throw new ValidationError('Payment not found');

    if (payment.status === 'paid') throw new ValidationError('Payment is already confirmed');
    if (payment.status === 'refunded') throw new ValidationError('Cannot confirm refunded payment');
    if (payment.status === 'failed') throw new ValidationError('Cannot confirm failed payment');

    if (
      payment.payment_method === 'bank_transfer' &&
      (!body.bank_transfer_details?.transfer_reference || !body.bank_transfer_details?.transfer_date)
    ) {
      return validationErrorResponse('Bank transfer details (transfer_reference, transfer_date) are required');
    }

    const { data: result, error: rpcError } = await supabase.rpc('confirm_payment', {
      p_payment_id: body.payment_id,
      p_bank_transfer_details: (body.bank_transfer_details as unknown as Json) ?? undefined,
      p_notes: body.notes ?? undefined,
    });

    if (rpcError) throw new AppError(`Payment confirmation failed: ${rpcError.message}`, 500);

    const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
    if (!rpcResult?.ok) handleRPCError(rpcResult);

    return successResponse(
      {
        payment_id: body.payment_id,
        booking_id: payment.booking_id,
        status: 'paid',
        confirmed_by: staff.id,
        confirmed_at: new Date().toISOString(),
      },
      'Payment confirmed successfully'
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
