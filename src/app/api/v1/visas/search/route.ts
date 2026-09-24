import { NextRequest, NextResponse } from 'next/server';
import { MOCK_VISAS } from '@/lib/mock/data';
import type { VisaSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: VisaSearchParams = {
    destination: searchParams.get('destination') || undefined,
    visa_type:   (searchParams.get('visa_type') as VisaSearchParams['visa_type']) || undefined,
    nationality: searchParams.get('nationality') || undefined,
  };

  let visas = MOCK_VISAS.filter(v => {
    if (params.destination &&
        !v.destination_country.toLowerCase().includes(params.destination.toLowerCase()) &&
        !v.country_code.toLowerCase().includes(params.destination.toLowerCase())) return false;
    if (params.visa_type && v.visa_type !== params.visa_type) return false;
    return true;
  });

  if (visas.length === 0) visas = MOCK_VISAS;

  return NextResponse.json({
    success: true,
    data: visas,
    meta: { count: visas.length },
  });
}
