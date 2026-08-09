"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/hooks/useFlightSearch";
import type { FlightOffer } from "@/types/flights";
import { useI18n } from "@/lib/i18n/context";

interface FlightResultsProps {
  results: FlightOffer[];
  loading: boolean;
  error: string | null;
  searched: boolean;
  className?: string;
}

export function FlightResults({
  results,
  loading,
  error,
  searched,
  className,
}: FlightResultsProps) {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={cn("mt-6 space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-border-light p-5 animate-pulse"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-bg-alt rounded w-1/3" />
                <div className="h-3 bg-bg-alt rounded w-1/4" />
              </div>
              <div className="h-8 bg-bg-alt rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    const isAuth =
      error.includes("401") ||
      error.toLowerCase().includes("unauthorized") ||
      error.toLowerCase().includes("not authenticated") ||
      error.toLowerCase().includes("could not validate");

    return (
      <div
        className={cn(
          "mt-6 bg-white border border-red-200 rounded-xl p-5 text-center",
          className
        )}
      >
        <p className="text-sm font-medium text-red-600">
          {isAuth
            ? isAr
              ? "يجب تسجيل الدخول أولاً للبحث عن رحلات"
              : "Please log in first to search flights"
            : error}
        </p>
      </div>
    );
  }

  // ── No results ────────────────────────────────────────────────────────────
  if (searched && results.length === 0) {
    return (
      <div
        className={cn(
          "mt-6 bg-white border border-border-light rounded-xl p-8 text-center",
          className
        )}
      >
        <p className="text-sm text-text-secondary">
          {isAr
            ? "لا توجد رحلات متاحة لهذا البحث"
            : "No flights found for this search"}
        </p>
      </div>
    );
  }

  if (!searched) return null;

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <div className={cn("mt-6 space-y-3", className)}>
      <p className="text-sm text-text-secondary font-medium px-1">
        {isAr
          ? `${results.length} رحلة متاحة`
          : `${results.length} flight${results.length !== 1 ? "s" : ""} found`}
      </p>

      {results.map((offer) => {
        const depTime = formatTime(offer.departure_time);
        const arrTime = formatTime(offer.arrival_time);
        // Extract IATA codes from departure/arrival times if present, else from raw_text
        const originCode = offer.flight_id.split("-")[1]?.slice(0, 3) ?? "???";
        const destCode   = offer.flight_id.split("-")[1]?.slice(3, 6) ?? "???";

        return (
          <div
            key={offer.flight_id}
            className="bg-white rounded-xl border border-border-light hover:border-brand-red/40 hover:shadow-md transition-all p-4 md:p-5"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">

              {/* Airline badge */}
              <div className="flex items-center gap-3 md:w-36 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-bg-alt flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                  {offer.flight_number.split(" ")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {offer.airline}
                  </p>
                  <p className="text-xs text-text-muted">{offer.flight_number}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                {/* Departure */}
                <div className="text-center shrink-0">
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {depTime}
                  </p>
                  <p className="text-xs font-semibold text-text-muted uppercase">
                    {originCode}
                  </p>
                </div>

                {/* Line + duration + stops */}
                <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                  <p className="text-xs text-text-muted">{offer.duration}</p>
                  <div className="w-full flex items-center gap-1">
                    <div className="flex-1 h-px bg-border-light" />
                    {offer.stops === 0 ? (
                      <span className="text-[10px] text-green-600 font-semibold shrink-0 px-1.5 py-0.5 rounded-full bg-green-50 border border-green-200">
                        {isAr ? "مباشر" : "Direct"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-brand-red font-semibold shrink-0 px-1.5 py-0.5 rounded-full bg-brand-red/5 border border-brand-red/20">
                        {isAr
                          ? `${offer.stops} ${offer.stops === 1 ? "توقف" : "توقفات"}`
                          : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
                      </span>
                    )}
                    <div className="flex-1 h-px bg-border-light" />
                  </div>
                  <p className="text-[10px] text-text-muted">{offer.flight_number}</p>
                </div>

                {/* Arrival */}
                <div className="text-center shrink-0">
                  <p className="text-xl font-bold text-text-primary tabular-nums">
                    {arrTime}
                  </p>
                  <p className="text-xs font-semibold text-text-muted uppercase">
                    {destCode}
                  </p>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1 justify-between md:justify-start shrink-0 md:ms-4 border-t border-border-light md:border-none pt-3 md:pt-0">
                <div className="text-end">
                  <p className="text-xl font-bold text-brand-red tabular-nums">
                    {offer.price.toLocaleString()}{" "}
                    <span className="text-sm font-semibold">{offer.price_currency}</span>
                  </p>
                </div>
                <button className="px-5 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors shrink-0">
                  {isAr ? "احجز الآن" : "Book Now"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
