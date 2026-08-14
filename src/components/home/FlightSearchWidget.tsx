"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import {
  PlaneIcon,
  PlaneLandIcon,
  CalendarIcon,
  PassengersIcon,
  SwapIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { useFlightSearch, CLASS_LABELS } from "@/hooks/useFlightSearch";
import { FlightResults } from "@/components/home/FlightResults";
import type { TravelClass } from "@/types/flights";

type TripType = "one-way" | "round-trip" | "multi-city";

interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export function FlightSearchWidget() {
  const { t, locale } = useI18n();
  const isAr = locale === "ar";
  const s = t.search;

  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [travelClass, setTravelClass] = useState<TravelClass>("economy");
  const [classOpen, setClassOpen] = useState(false);
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [passengerOpen, setPassengerOpen] = useState(false);

  const { results, loading, error, searched, search, clear } = useFlightSearch();

  const totalPassengers =
    passengers.adults + passengers.children + passengers.infants;

  function swapLocations() {
    setFrom(to);
    setTo(from);
  }

  function adjustPassenger(type: keyof PassengerCounts, delta: number) {
    setPassengers((prev) => {
      const next = prev[type] + delta;
      const min = type === "adults" ? 1 : 0;
      const max = type === "infants" ? prev.adults : 9;
      return { ...prev, [type]: Math.min(max, Math.max(min, next)) };
    });
  }

  async function handleSearch() {
    if (!from.trim() || !to.trim() || !departure) return;
    await search({
      origin: from.trim().toUpperCase(),
      destination: to.trim().toUpperCase(),
      departure_date: departure,
      ...(tripType !== "one-way" && returnDate ? { return_date: returnDate } : {}),
      passenger_count: totalPassengers,
      travel_class: travelClass,
    });
    setTimeout(() => {
      document
        .getElementById("flight-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const tabs = [
    { id: "one-way" as TripType, label: s.oneWay },
    { id: "round-trip" as TripType, label: s.roundTrip },
    { id: "multi-city" as TripType, label: s.multiCity },
  ];

  const classOptions: TravelClass[] = ["economy", "premium_economy", "business", "first"];

  const passengerRows = [
    { key: "adults"   as const, label: isAr ? "بالغون"  : "Adults",   sub: isAr ? "١٢ سنة فأكثر" : "12+ yrs" },
    { key: "children" as const, label: isAr ? "أطفال"   : "Children", sub: isAr ? "٢–١١ سنة"     : "2–11 yrs" },
    { key: "infants"  as const, label: isAr ? "رضّع"    : "Infants",  sub: isAr ? "أقل من سنتين" : "Under 2" },
  ];

  /* ── shared field styles ──
     Fully transparent bg, solid white border so the line always shows,
     white text so it reads on any hero image.
  */
  const fieldLabel = "block text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1 px-0.5";

  const fieldBox = cn(
    "relative flex items-center h-12 w-full rounded-xl overflow-hidden",
    "border border-white/40",
    "bg-black/20 backdrop-blur-sm",
    "transition-all duration-200",
    "focus-within:border-brand-yellow focus-within:bg-black/30 focus-within:ring-1 focus-within:ring-brand-yellow/40"
  );

  const fieldInput = cn(
    "w-full h-full bg-transparent outline-none",
    "text-white text-sm font-medium",
    "placeholder:text-white/40",
    "px-3"
  );

  const fieldIcon = "shrink-0 text-brand-yellow ps-3";

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Trip-type tabs ── */}
      <div className="flex gap-1 mb-4 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setTripType(tab.id); clear(); }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200",
              tripType === tab.id
                ? "bg-brand-green text-white shadow-lg shadow-brand-green/40"
                : "border border-white/30 text-white/70 hover:text-white hover:border-white/60 bg-black/10 backdrop-blur-sm"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search card ── */}
      <div className="rounded-2xl border border-white/30 bg-black/25 backdrop-blur-md p-4 space-y-3 shadow-2xl">

        {/* Row 1 — From / Swap / To */}
        <div className="grid grid-cols-[1fr_36px_1fr] items-end gap-2">
          {/* From */}
          <div>
            <label className={fieldLabel}>{isAr ? "من" : "From"}</label>
            <div className={fieldBox}>
              <span className={fieldIcon}><PlaneIcon size={15} /></span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={isAr ? "مطار أو مدينة" : "Airport or city"}
                className={cn(fieldInput, "uppercase")}
                maxLength={3}
              />
            </div>
          </div>

          {/* Swap */}
          <button
            onClick={swapLocations}
            aria-label={s.swap}
            className="mb-0.5 w-9 h-9 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm flex items-center justify-center text-brand-yellow hover:bg-brand-yellow/20 hover:border-brand-yellow/70 transition-all duration-200"
          >
            <SwapIcon size={15} />
          </button>

          {/* To */}
          <div>
            <label className={fieldLabel}>{isAr ? "إلى" : "To"}</label>
            <div className={fieldBox}>
              <span className={fieldIcon}><PlaneLandIcon size={15} /></span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={isAr ? "مطار أو مدينة" : "Airport or city"}
                className={cn(fieldInput, "uppercase")}
                maxLength={3}
              />
            </div>
          </div>
        </div>

        {/* Row 2 — Dates */}
        <div className={cn("grid gap-2", tripType === "round-trip" ? "grid-cols-2" : "grid-cols-1")}>
          <div>
            <label className={fieldLabel}>{isAr ? "المغادرة" : "Departure"}</label>
            <div className={fieldBox}>
              <span className={fieldIcon}><CalendarIcon size={15} /></span>
              <input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={cn(
                  fieldInput,
                  "[color-scheme:dark]",
                  "[&::-webkit-calendar-picker-indicator]:opacity-0",
                  "[&::-webkit-calendar-picker-indicator]:absolute",
                  "[&::-webkit-inner-spin-button]:hidden",
                )}
              />
            </div>
          </div>

          <AnimatePresence>
            {tripType === "round-trip" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <label className={fieldLabel}>{isAr ? "العودة" : "Return"}</label>
                <div className={fieldBox}>
                  <span className={fieldIcon}><CalendarIcon size={15} /></span>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departure}
                    className={cn(
                      fieldInput,
                      "[color-scheme:dark]",
                      "[&::-webkit-calendar-picker-indicator]:opacity-0",
                      "[&::-webkit-calendar-picker-indicator]:absolute",
                      "[&::-webkit-inner-spin-button]:hidden",
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 3 — Passengers + Class */}
        <div className="grid grid-cols-2 gap-2">

          {/* Passengers */}
          <div className="relative">
            <label className={fieldLabel}>{isAr ? "المسافرون" : "Passengers"}</label>
            <button
              onClick={() => { setPassengerOpen(!passengerOpen); setClassOpen(false); }}
              className={cn(
                fieldBox,
                "cursor-pointer justify-between px-3",
                passengerOpen && "border-brand-yellow ring-1 ring-brand-yellow/40"
              )}
            >
              <span className="text-brand-yellow me-2 shrink-0"><PassengersIcon size={15} /></span>
              <span className="flex-1 text-start text-white text-sm truncate">
                {totalPassengers} {isAr ? (totalPassengers === 1 ? "مسافر" : "مسافرون") : "Pax"}
              </span>
              <ChevronDownIcon
                size={13}
                className={cn("text-white/50 shrink-0 transition-transform duration-200", passengerOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {passengerOpen && (
                <motion.div
                  className="absolute top-full mt-2 start-0 end-0 z-50 rounded-xl border border-white/20 bg-[#0f2419]/95 backdrop-blur-xl shadow-2xl p-3 space-y-0.5"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {passengerRows.map(({ key, label, sub }) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                        <p className="text-[10px] text-white/40">{sub}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustPassenger(key, -1)}
                          className="w-7 h-7 rounded-full border border-brand-green-light/50 text-brand-green-light hover:bg-brand-green/30 flex items-center justify-center text-lg leading-none transition-all"
                        >−</button>
                        <span className="w-5 text-center text-sm font-bold text-white">{passengers[key]}</span>
                        <button
                          onClick={() => adjustPassenger(key, 1)}
                          className="w-7 h-7 rounded-full border border-brand-green-light/50 text-brand-green-light hover:bg-brand-green/30 flex items-center justify-center text-lg leading-none transition-all"
                        >+</button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setPassengerOpen(false)}
                    className="w-full mt-2 py-2 rounded-lg bg-brand-green text-white text-xs font-bold tracking-wide hover:bg-brand-green-light transition-colors"
                  >
                    {isAr ? "تأكيد" : "Done"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Travel class */}
          <div className="relative">
            <label className={fieldLabel}>{isAr ? "الدرجة" : "Class"}</label>
            <button
              onClick={() => { setClassOpen(!classOpen); setPassengerOpen(false); }}
              className={cn(
                fieldBox,
                "cursor-pointer justify-between px-3",
                classOpen && "border-brand-yellow ring-1 ring-brand-yellow/40"
              )}
            >
              <span className="flex-1 text-start text-white text-sm truncate">
                {CLASS_LABELS[travelClass][locale as keyof typeof CLASS_LABELS[TravelClass]]}
              </span>
              <ChevronDownIcon
                size={13}
                className={cn("text-white/50 shrink-0 transition-transform duration-200", classOpen && "rotate-180")}
              />
            </button>

            <AnimatePresence>
              {classOpen && (
                <motion.div
                  className="absolute top-full mt-2 start-0 end-0 z-50 rounded-xl border border-white/20 bg-[#0f2419]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  {classOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => { setTravelClass(option); setClassOpen(false); }}
                      className={cn(
                        "w-full text-start px-4 py-2.5 text-sm border-b border-white/8 last:border-0 transition-colors",
                        travelClass === option
                          ? "bg-brand-green/40 text-brand-yellow font-bold"
                          : "text-white/80 hover:bg-white/10"
                      )}
                    >
                      {CLASS_LABELS[option][locale as keyof typeof CLASS_LABELS[TravelClass]]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Search button ── */}
        <button
          onClick={handleSearch}
          disabled={loading || !from.trim() || !to.trim() || !departure}
          className={cn(
            "w-full h-12 rounded-xl font-bold text-sm tracking-wide",
            "bg-brand-green text-white",
            "border border-brand-green-light/40",
            "shadow-lg shadow-brand-green/30",
            "hover:bg-brand-green-light hover:shadow-xl hover:shadow-brand-green/40 hover:-translate-y-px",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0",
            "transition-all duration-200"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {isAr ? "جارٍ البحث..." : "Searching..."}
              </>
            ) : (
              <>
                <PlaneIcon size={16} />
                {s.searchFlights}
              </>
            )}
          </span>
        </button>
      </div>

      {/* ── Results ── */}
      {searched && (
        <motion.div
          id="flight-results"
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FlightResults
            results={results}
            loading={loading}
            error={error}
            searched={true}
            onClear={clear}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
