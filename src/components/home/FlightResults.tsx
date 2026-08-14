"use client";

import { cn } from "@/lib/utils";
import { formatTime } from "@/hooks/useFlightSearch";
import type { FlightOffer } from "@/types/flights";
import { useI18n } from "@/lib/i18n/context";
import { StaggerContainer, FadeInUp, HoverLift } from "@/components/ui/motion-wrapper";
import { Button } from "@/components/ui/button";

interface FlightResultsProps {
  results: FlightOffer[];
  loading: boolean;
  error: string | null;
  searched: boolean;
  className?: string;
  origin?: string;
  destination?: string;
  onClear?: () => void;
}

export function FlightResults({
  results,
  loading,
  error,
  searched,
  className,
  origin = "CAI",      // Default to CAI (Cairo)
  destination = "DXB", // Default to DXB (Dubai) 
}: FlightResultsProps) {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <StaggerContainer className={cn("mt-6 space-y-4", className)} stagger={0.15}>
        {[1, 2, 3].map((i) => (
          <FadeInUp
            key={i}
            className="glass-card rounded-2xl p-6 animate-pulse"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-bg-alt rounded-lg w-1/3" />
                <div className="h-3 bg-bg-alt rounded-lg w-1/4" />
              </div>
              <div className="h-10 bg-bg-alt rounded-xl w-28" />
            </div>
          </FadeInUp>
        ))}
      </StaggerContainer>
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
      <FadeInUp
        className={cn(
          "mt-6 glass-card border-red-200 rounded-2xl p-6 text-center",
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
      </FadeInUp>
    );
  }

  // ── No results ────────────────────────────────────────────────────────────
  if (searched && results.length === 0) {
    return (
      <FadeInUp
        className={cn(
          "mt-6 glass-card rounded-2xl p-8 text-center",
          className
        )}
      >
        <p className="text-sm text-text-secondary">
          {isAr
            ? "لا توجد رحلات متاحة لهذا البحث"
            : "No flights found for this search"}
        </p>
      </FadeInUp>
    );
  }

  if (!searched) return null;

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <StaggerContainer className={cn("mt-6 space-y-4", className)} stagger={0.1}>
      <FadeInUp>
        <p className="text-sm text-text-secondary font-medium px-1">
          {isAr
            ? `${results.length} رحلة متاحة`
            : `${results.length} flight${results.length !== 1 ? "s" : ""} found`}
        </p>
      </FadeInUp>

      {results.map((offer, index) => {
        const depTime = formatTime(offer.departure_time);
        const arrTime = formatTime(offer.arrival_time);
        
        // WHITE LABEL: Use origin/destination props instead of parsing flight_id
        // This eliminates "???" and ensures correct airport codes
        const originCode = origin;
        const destCode = destination;

        return (
          <HoverLift
            key={offer.flight_id}
            className="glass-card rounded-2xl border-white/30 hover:glass-panel transition-all duration-300 p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">

              {/* Airline badge */}
              <div className="flex items-center gap-3 md:w-40 shrink-0">
                <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center text-sm font-bold text-brand-green shrink-0">
                  {offer.flight_number.split(" ")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-luxury truncate">
                    {offer.airline}
                  </p>
                  <p className="text-xs text-text-secondary">{offer.flight_number}</p>
                </div>
              </div>

              {/* Route */}
              <div className="flex-1 flex items-center gap-4 min-w-0">
                {/* Departure */}
                <div className="text-center shrink-0">
                  <p className="text-2xl font-bold text-text-luxury tabular-nums">
                    {depTime}
                  </p>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {originCode}
                  </p>
                </div>

                {/* Line + duration + stops */}
                <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <p className="text-xs text-text-secondary font-medium">{offer.duration}</p>
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-green/20 to-brand-green/60" />
                    {offer.stops === 0 ? (
                      <span className="text-[10px] text-emerald-700 font-bold shrink-0 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                        {isAr ? "مباشر" : "Direct"}
                      </span>
                    ) : (
                      <span className="text-[10px] text-brand-yellow-dark font-bold shrink-0 px-2 py-1 rounded-full bg-brand-yellow/10 border border-brand-yellow/30">
                        {isAr
                          ? `${offer.stops} ${offer.stops === 1 ? "توقف" : "توقفات"}`
                          : `${offer.stops} stop${offer.stops > 1 ? "s" : ""}`}
                      </span>
                    )}
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-green/60 to-brand-green/20" />
                  </div>
                  <p className="text-[10px] text-text-muted">{offer.flight_number}</p>
                </div>

                {/* Arrival */}
                <div className="text-center shrink-0">
                  <p className="text-2xl font-bold text-text-luxury tabular-nums">
                    {arrTime}
                  </p>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {destCode}
                  </p>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-3 justify-between md:justify-start shrink-0 md:ms-4 border-t border-white/20 md:border-none pt-4 md:pt-0">
                <div className="text-end">
                  <p className="text-2xl font-bold text-brand-green tabular-nums">
                    {offer.price.toLocaleString()}{" "}
                    <span className="text-sm font-semibold text-text-secondary">{offer.price_currency}</span>
                  </p>
                  <p className="text-xs text-text-muted">{isAr ? "شامل الضرائب" : "incl. taxes"}</p>
                </div>
                <Button 
                  variant="luxury" 
                  size="sm"
                  className="shrink-0 min-w-24"
                  withShimmer
                >
                  {isAr ? "احجز الآن" : "Book Now"}
                </Button>
              </div>
            </div>
          </HoverLift>
        );
      })}
    </StaggerContainer>
  );
}
