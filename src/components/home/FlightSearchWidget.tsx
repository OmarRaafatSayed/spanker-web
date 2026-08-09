"use client";

import { useState } from "react";
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

  const { results, loading, error, searched, search, clear } =
    useFlightSearch();

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
      ...(tripType !== "one-way" && returnDate
        ? { return_date: returnDate }
        : {}),
      passenger_count: totalPassengers,
      travel_class: travelClass,
    });

    // Scroll results into view
    setTimeout(() => {
      document
        .getElementById("flight-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const inputClass =
    "w-full h-12 ps-9 pe-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition";

  const iconClass = "absolute start-3 top-1/2 -translate-y-1/2 text-brand-red";

  const tabs = [
    { id: "one-way" as TripType, label: s.oneWay },
    { id: "round-trip" as TripType, label: s.roundTrip },
    { id: "multi-city" as TripType, label: s.multiCity },
  ];

  const classOptions: TravelClass[] = [
    "economy",
    "premium_economy",
    "business",
    "first",
  ];

  return (
    <div>
      <div className="bg-white rounded-xl lg:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-4 md:p-6 w-full max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 md:mb-6 border-b border-border-light overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTripType(tab.id);
                clear();
              }}
              className={cn(
                "px-4 md:px-5 py-2 md:py-2.5 text-sm font-semibold rounded-t transition-colors relative -mb-px whitespace-nowrap shrink-0",
                tripType === tab.id
                  ? "text-brand-red border-b-2 border-brand-red"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
          {/* From */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
              {s.from}
            </label>
            <div className="relative">
              <PlaneIcon size={16} className={iconClass} />
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={s.cityOrAirport}
                className={cn(inputClass, "placeholder:text-text-muted uppercase")}
                maxLength={3}
              />
            </div>
          </div>

          {/* Swap */}
          <button
            onClick={swapLocations}
            aria-label={s.swap}
            className="self-end h-12 w-10 flex items-center justify-center text-brand-red border border-border-light rounded-lg hover:bg-bg-alt transition shrink-0"
          >
            <SwapIcon size={18} />
          </button>

          {/* To */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
              {s.to}
            </label>
            <div className="relative">
              <PlaneLandIcon size={16} className={iconClass} />
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={s.cityOrAirport}
                className={cn(inputClass, "placeholder:text-text-muted uppercase")}
                maxLength={3}
              />
            </div>
          </div>

          {/* Departure */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
              {s.departure}
            </label>
            <div className="relative">
              <CalendarIcon size={16} className={iconClass} />
              <input
                type="date"
                value={departure}
                onChange={(e) => setDeparture(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
            </div>
          </div>

          {/* Return */}
          {tripType !== "one-way" && (
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
                {s.return}
              </label>
              <div className="relative">
                <CalendarIcon size={16} className={iconClass} />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departure}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Class selector */}
          <div className="flex-1 min-w-0 relative">
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
              {isAr ? "الدرجة" : "Class"}
            </label>
            <button
              onClick={() => setClassOpen(!classOpen)}
              className="w-full h-12 px-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition flex items-center justify-between bg-white"
            >
              <span>{CLASS_LABELS[travelClass][locale]}</span>
              <ChevronDownIcon
                size={14}
                className={cn("transition-transform text-text-muted", classOpen ? "rotate-180" : "")}
              />
            </button>

            {classOpen && (
              <div className="absolute top-full start-0 end-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg z-50 overflow-hidden">
                {classOptions.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      setTravelClass(cls);
                      setClassOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-start hover:bg-bg-alt transition",
                      travelClass === cls
                        ? "text-brand-red font-semibold bg-brand-red/5"
                        : "text-text-primary"
                    )}
                  >
                    {CLASS_LABELS[cls][locale]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="flex-1 min-w-0 relative">
            <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">
              {s.passengers}
            </label>
            <button
              onClick={() => setPassengerOpen(!passengerOpen)}
              className="w-full h-12 ps-9 pe-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition flex items-center justify-between bg-white"
            >
              <PassengersIcon size={16} className={iconClass} />
              <span>
                {totalPassengers}{" "}
                {totalPassengers === 1 ? s.passenger : s.passengers_plural}
              </span>
              <ChevronDownIcon
                size={14}
                className={cn(
                  "transition-transform",
                  passengerOpen ? "rotate-180" : ""
                )}
              />
            </button>

            {passengerOpen && (
              <div className="absolute top-full start-0 end-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg p-4 z-50 space-y-3">
                {(
                  [
                    {
                      key: "adults" as const,
                      label: s.adults,
                      sub: s.adultsAge,
                    },
                    {
                      key: "children" as const,
                      label: s.children,
                      sub: s.childrenAge,
                    },
                    {
                      key: "infants" as const,
                      label: s.infants,
                      sub: s.infantsAge,
                    },
                  ] as const
                ).map(({ key, label, sub }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {label}
                      </p>
                      <p className="text-xs text-text-muted">{sub}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => adjustPassenger(key, -1)}
                        className="w-7 h-7 rounded-full border border-border-light flex items-center justify-center text-text-secondary hover:border-brand-red hover:text-brand-red transition text-lg leading-none"
                        aria-label={`-`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">
                        {passengers[key]}
                      </span>
                      <button
                        onClick={() => adjustPassenger(key, 1)}
                        className="w-7 h-7 rounded-full border border-border-light flex items-center justify-center text-text-secondary hover:border-brand-red hover:text-brand-red transition text-lg leading-none"
                        aria-label={`+`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setPassengerOpen(false)}
                  className="w-full mt-2 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition"
                >
                  {s.done}
                </button>
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={loading || !from.trim() || !to.trim() || !departure}
            className={cn(
              "h-12 px-6 text-white font-semibold text-sm rounded-lg transition-colors w-full lg:w-auto shrink-0 whitespace-nowrap",
              loading || !from.trim() || !to.trim() || !departure
                ? "bg-brand-red/50 cursor-not-allowed"
                : "bg-brand-red hover:bg-brand-red-dark"
            )}
          >
            {loading
              ? isAr
                ? "جاري البحث..."
                : "Searching..."
              : s.searchFlights}
          </button>
        </div>
      </div>

      {/* Results */}
      <div id="flight-results" className="w-full max-w-5xl mx-auto px-0">
        <FlightResults
          results={results}
          loading={loading}
          error={error}
          searched={searched}
        />
      </div>
    </div>
  );
}
