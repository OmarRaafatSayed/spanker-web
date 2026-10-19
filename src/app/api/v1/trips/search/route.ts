import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { MOCK_TRIPS } from '@/lib/mock/data';
import type { TripSearchParams } from '@/types/api';

const META_PREFIX = '__meta__:';

function unpackMeta(desc: string | null): Record<string, unknown> {
  if (!desc?.startsWith(META_PREFIX)) return {};
  const nlIdx = desc.indexOf('\n');
  const jsonStr = nlIdx === -1 ? desc.slice(META_PREFIX.length) : desc.slice(META_PREFIX.length, nlIdx);
  try { return JSON.parse(jsonStr); } catch { return {}; }
}

function unpackPlain(desc: string | null): string {
  if (!desc?.startsWith(META_PREFIX)) return desc ?? '';
  const nlIdx = desc.indexOf('\n');
  return nlIdx === -1 ? '' : desc.slice(nlIdx + 1);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const slug = searchParams.get('slug') || undefined;
  const isDomestic = searchParams.get('domestic'); // "true" | "false" | null

  const params: TripSearchParams = {
    destination:   searchParams.get('destination')   || undefined,
    duration_days: searchParams.get('duration_days') ? parseInt(searchParams.get('duration_days')!) : undefined,
    min_price:     searchParams.get('min_price')     ? parseInt(searchParams.get('min_price')!)     : undefined,
    max_price:     searchParams.get('max_price')     ? parseInt(searchParams.get('max_price')!)     : undefined,
    difficulty:    (searchParams.get('difficulty') as TripSearchParams['difficulty']) || undefined,
  };

  try {
    // ── Try live DB first ──────────────────────────────────────────────────
    const supabase = await createServerClient();

    let query = supabase
      .from('trips')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .gte('available_spots', 1)
      .order('start_date', { ascending: true });

    if (params.destination) {
      query = query.ilike('destination', `%${params.destination}%`);
    }
    if (params.duration_days) {
      query = query.eq('duration_days', params.duration_days);
    }
    if (params.min_price) {
      query = query.gte('price_per_person', params.min_price);
    }
    if (params.max_price) {
      query = query.lte('price_per_person', params.max_price);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Unpack meta and build the rich trip shape the customer page expects
      let trips = data.map(t => {
        const meta = unpackMeta(t.description);
        const plain = unpackPlain(t.description);

        return {
          id:               t.id,
          title_ar:         (meta.title_ar as string) || t.name,
          title_en:         (meta.title_en as string) || t.name,
          slug:             (meta.slug as string) || t.id,
          destination:      t.destination,
          country:          t.destination,
          duration_days:    t.duration_days,
          start_date:       t.start_date,
          end_date:         t.end_date,
          spots_available:  t.available_spots,
          group_size_max:   t.max_travelers ?? 25,
          price_per_person: t.price_per_person ?? 0,
          currency:         t.currency ?? 'EGP',
          difficulty:       (meta.difficulty as string) || 'easy',
          meeting_point:    (meta.meeting_point as string) || '',
          image_url:        (meta.image_url as string) || null,
          is_domestic:      (meta.is_domestic as boolean) ?? false,
          tags:             (meta.tags as string[]) || [],
          description:      plain,
          includes:         (t.inclusions as string[]) ?? [],
          excludes:         (t.exclusions as string[]) ?? [],
          itinerary:        (t.itinerary as { day: number; title: string; description: string }[]) ?? [],
        };
      });

      // Client-side filters that PostgREST can't do on JSON fields
      if (slug) {
        trips = trips.filter(t => t.slug === slug || t.id === slug);
      }
      if (params.difficulty) {
        trips = trips.filter(t => t.difficulty === params.difficulty);
      }
      if (isDomestic !== null) {
        const wantDomestic = isDomestic === 'true';
        trips = trips.filter(t => t.is_domestic === wantDomestic);
      }

      if (trips.length > 0) {
        return NextResponse.json({ success: true, data: trips, meta: { count: trips.length, source: 'db' } });
      }
    }

    // ── Fallback to mock data ──────────────────────────────────────────────
    let mockTrips = MOCK_TRIPS.filter(t => {
      if (slug && t.slug !== slug) return false;
      if (params.destination && !t.destination.toLowerCase().includes(params.destination.toLowerCase())) return false;
      if (params.duration_days && t.duration_days !== params.duration_days) return false;
      if (params.min_price && t.price_per_person < params.min_price) return false;
      if (params.max_price && t.price_per_person > params.max_price) return false;
      if (params.difficulty && t.difficulty !== params.difficulty) return false;
      return true;
    });

    if (mockTrips.length === 0 && !slug) mockTrips = MOCK_TRIPS;

    return NextResponse.json({ success: true, data: mockTrips, meta: { count: mockTrips.length, source: 'mock' } });

  } catch (err) {
    console.error('[trips/search]', err);
    return NextResponse.json({ success: true, data: MOCK_TRIPS, meta: { count: MOCK_TRIPS.length, source: 'mock-fallback' } });
  }
}
