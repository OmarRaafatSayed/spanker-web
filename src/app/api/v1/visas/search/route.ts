/**
 * GET /api/v1/visas/search
 * 
 * Search for visa programs with nationality eligibility check
 * Public endpoint (no auth required)
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api';
import type { Visa, VisaSearchParams } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/visas/search
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: VisaSearchParams = {
      destination: searchParams.get('destination') || undefined,
      visa_type: (searchParams.get('visa_type') as
        | 'tourist'
        | 'business'
        | 'student'
        | 'work'
        | 'transit') || undefined,
      nationality: searchParams.get('nationality') || undefined,
    };

    // Validate visa type
    if (
      params.visa_type &&
      !['tourist', 'business', 'student', 'work', 'transit'].includes(params.visa_type)
    ) {
      return validationErrorResponse(
        'Visa type must be one of: tourist, business, student, work, transit'
      );
    }

    // Validate nationality code (ISO 3166-1 alpha-2)
    if (params.nationality && params.nationality.length !== 2) {
      return validationErrorResponse(
        'Nationality must be a 2-letter country code (e.g., EG, SA, AE)'
      );
    }

    // Call search_visas RPC function
    const { data: visas, error } = await supabase.rpc('search_visas', {
      p_destination: params.destination || null,
      p_visa_type: params.visa_type || null,
      p_nationality: params.nationality ? params.nationality.toUpperCase() : null,
    });

    if (error) {
      console.error('[GET /api/v1/visas/search] RPC error:', error);
      throw new Error(`Visa search failed: ${error.message}`);
    }

    return successResponse(
      (visas || []) as Visa[],
      undefined,
      {
        count: visas?.length || 0,
        filters: {
          destination: params.destination,
          visa_type: params.visa_type,
          nationality: params.nationality?.toUpperCase(),
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/v1/visas/search] Error:', error);
    return errorResponse(error as Error);
  }
}
