/**
 * GET /api/v1/trips/search
 * 
 * Search for available trips with filters
 * Public endpoint (no auth required)
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api';
import type { Trip, TripSearchParams } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/trips/search
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: TripSearchParams = {
      destination: searchParams.get('destination') || undefined,
      start_date_from: searchParams.get('start_date_from') || undefined,
      start_date_to: searchParams.get('start_date_to') || undefined,
      duration_days: searchParams.get('duration_days')
        ? parseInt(searchParams.get('duration_days')!)
        : undefined,
      difficulty: (searchParams.get('difficulty') as 'easy' | 'moderate' | 'challenging') || undefined,
      min_price: searchParams.get('min_price')
        ? parseFloat(searchParams.get('min_price')!)
        : undefined,
      max_price: searchParams.get('max_price')
        ? parseFloat(searchParams.get('max_price')!)
        : undefined,
    };

    // Validate date range
    if (params.start_date_from && params.start_date_to) {
      const startFrom = new Date(params.start_date_from);
      const startTo = new Date(params.start_date_to);

      if (isNaN(startFrom.getTime()) || isNaN(startTo.getTime())) {
        return validationErrorResponse('Invalid date format');
      }

      if (startFrom > startTo) {
        return validationErrorResponse('start_date_from must be before start_date_to');
      }
    }

    // Validate duration
    if (params.duration_days && (params.duration_days < 1 || params.duration_days > 90)) {
      return validationErrorResponse('Duration must be between 1 and 90 days');
    }

    // Validate difficulty
    if (params.difficulty && !['easy', 'moderate', 'challenging'].includes(params.difficulty)) {
      return validationErrorResponse(
        'Difficulty must be one of: easy, moderate, challenging'
      );
    }

    // Validate price range
    if (params.min_price && params.max_price && params.min_price > params.max_price) {
      return validationErrorResponse('min_price must be less than max_price');
    }

    // Call search_trips RPC function
    const { data: trips, error } = await supabase.rpc('search_trips', {
      p_destination: params.destination || null,
      p_start_date_from: params.start_date_from || null,
      p_start_date_to: params.start_date_to || null,
      p_duration_days: params.duration_days || null,
      p_difficulty: params.difficulty || null,
      p_min_price: params.min_price || null,
      p_max_price: params.max_price || null,
    });

    if (error) {
      console.error('[GET /api/v1/trips/search] RPC error:', error);
      throw new Error(`Trip search failed: ${error.message}`);
    }

    return successResponse(
      (trips || []) as Trip[],
      undefined,
      {
        count: trips?.length || 0,
        filters: {
          destination: params.destination,
          start_date_from: params.start_date_from,
          start_date_to: params.start_date_to,
          duration_days: params.duration_days,
          difficulty: params.difficulty,
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/v1/trips/search] Error:', error);
    return errorResponse(error as Error);
  }
}
