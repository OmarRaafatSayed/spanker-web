import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import type { Visa, VisaSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const params: VisaSearchParams = {
      destination: searchParams.get('destination') || undefined,
      visa_type: (searchParams.get('visa_type') as 'tourist' | 'business' | 'student' | 'work' | 'transit') || undefined,
      nationality: searchParams.get('nationality') || undefined,
    };

    if (params.visa_type && !['tourist', 'business', 'student', 'work', 'transit'].includes(params.visa_type)) {
      return validationErrorResponse('Visa type must be one of: tourist, business, student, work, transit');
    }
    if (params.nationality && params.nationality.length !== 2) {
      return validationErrorResponse('Nationality must be a 2-letter country code (e.g., EG, SA, AE)');
    }

    const { data: visas, error } = await supabase.rpc('search_visas', {
      p_destination: params.destination ?? undefined,
      p_visa_type: params.visa_type ?? undefined,
      p_nationality: params.nationality ? params.nationality.toUpperCase() : undefined,
    });

    if (error) throw new AppError(`Visa search failed: ${error.message}`, 500);

    return successResponse(
      (visas as unknown as Visa[]) || [],
      undefined,
      { count: (visas as unknown[])?.length || 0 }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
