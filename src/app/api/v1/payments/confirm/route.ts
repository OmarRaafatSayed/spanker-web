/**
 * POST /api/v1/payments/confirm
 * 
 * Confirm a payment (staff only)
 * Updates payment status to 'paid' and booking status to 'confirmed'
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireStaff,
  successResponse,
  errorResponse,
  validationErrorResponse,
  handleRPCError,
  ValidationError,
} from '@/lib/api';
import type { ConfirmPaymentRequest } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/payments/confirm
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    // 1. Require staff access (admin or agent)
    const staff = await requireStaff(['admin', 'agent']);

    // 2. Parse request body
    const body = (await request.json()) as ConfirmPaymentRequest;

    if (!body.payment_id) {
      return validationErrorResponse('payment_id is required');
    }

    // 3. Validate bank transfer details if method is bank_transfer
    const supabase = await createSupabaseServerClient();

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('id, method, status, booking_id')
      .eq('id', body.payment_id)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/v1/payments/confirm] Fetch error:', fetchError);
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }

    if (!payment) {
      throw new ValidationError('Payment not found');
    }

    // Validate status
    if (payment.status === 'paid') {
      throw new ValidationError('Payment is already confirmed');
    }

    if (payment.status === 'refunded') {
      throw new ValidationError('Cannot confirm refunded payment');
    }

    if (payment.status === 'failed') {
      throw new ValidationError('Cannot confirm failed payment');
    }

    // Validate bank transfer details
    if (
      payment.method === 'bank_transfer' &&
      (!body.bank_transfer_details?.transfer_reference ||
        !body.bank_transfer_details?.transfer_date)
    ) {
      return validationErrorResponse(
        'Bank transfer details (transfer_reference, transfer_date) are required for bank_transfer method'
      );
    }

    // 4. Call confirm_payment RPC function
    const { data: result, error: rpcError } = await supabase.rpc('confirm_payment', {
      p_payment_id: body.payment_id,
      p_bank_transfer_details: body.bank_transfer_details || null,
      p_notes: body.notes || null,
    });

    if (rpcError) {
      console.error('[POST /api/v1/payments/confirm] RPC error:', rpcError);
      throw new Error(`Payment confirmation failed: ${rpcError.message}`);
    }

    // 5. Check RPC function response
    if (!result.ok) {
      handleRPCError(result);
    }

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
    console.error('[POST /api/v1/payments/confirm] Error:', error);
    return errorResponse(error as Error);
  }
}
