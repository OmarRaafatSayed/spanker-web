import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import type { Trip, TripSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const params: TripSearchParams = {
      destination: searchParams.get('destination') || undefined,
      start_date_from: searchParams.get('start_date_from') || undefined,
      start_date_to: searchParams.get('start_date_to') || undefined,
      duration_days: searchParams.get('duration_days') ? parseInt(searchParams.get('duration_days')!) : undefined,
      difficulty: (searchParams.get('difficulty') as 'easy' | 'moderate' | 'challenging') || undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    };

    if (params.start_date_from && params.start_date_to) {
      const sf = new Date(params.start_date_from);
      const st = new Date(params.start_date_to);
      if (isNaN(sf.getTime()) || isNaN(st.getTime())) return validationErrorResponse('Invalid date format');
      if (sf > st) return validationErrorResponse('start_date_from must be before start_date_to');
    }
    if (params.duration_days && (params.duration_days < 1 || params.duration_days > 90)) {
      return validationErrorResponse('Duration must be between 1 and 90 days');
    }
    if (params.min_price && params.max_price && params.min_price > params.max_price) {
      return validationErrorResponse('min_price must be less than max_price');
    }

    const { data: trips, error } = await supabase.rpc('search_trips', {
      p_destination: params.destination ?? undefined,
      p_start_date_from: params.start_date_from ?? undefined,
      p_start_date_to: params.start_date_to ?? undefined,
      p_duration_days: params.duration_days ?? undefined,
      p_difficulty: params.difficulty ?? undefined,
      p_min_price: params.min_price ?? undefined,
      p_max_price: params.max_price ?? undefined,
    });

    if (error) throw new AppError(`Trip search failed: ${error.message}`, 500);

    return successResponse(
      (trips as unknown as Trip[]) || [],
      undefined,
      { count: (trips as unknown[])?.length || 0 }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
