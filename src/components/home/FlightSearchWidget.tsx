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

type TripType = "one-way" | "round-trip" | "multi-city";

interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export function FlightSearchWidget() {
  const { t } = useI18n();
  const s = t.search;

  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
  });
  const [passengerOpen, setPassengerOpen] = useState(false);

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

  const inputClass =
    "w-full h-12 ps-9 pe-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition";

  const iconClass = "absolute start-3 top-1/2 -translate-y-1/2 text-brand-red";

  const tabs = [
    { id: "one-way" as TripType, label: s.oneWay },
    { id: "round-trip" as TripType, label: s.roundTrip },
    { id: "multi-city" as TripType, label: s.multiCity },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-6 w-full max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-light">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTripType(tab.id)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold rounded-t transition-colors relative -mb-px",
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
              className={cn(inputClass, "placeholder:text-text-muted")}
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
              className={cn(inputClass, "placeholder:text-text-muted")}
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
              className={cn("transition-transform", passengerOpen ? "rotate-180" : "")}
            />
          </button>

          {passengerOpen && (
            <div className="absolute top-full start-0 end-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg p-4 z-50 space-y-3">
              {([
                { key: "adults" as const, label: s.adults, sub: s.adultsAge },
                { key: "children" as const, label: s.children, sub: s.childrenAge },
                { key: "infants" as const, label: s.infants, sub: s.infantsAge },
              ]).map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
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

        {/* Search */}
        <button className="h-12 px-6 bg-brand-red text-white font-semibold text-sm rounded-lg hover:bg-brand-red-dark transition-colors shrink-0 whitespace-nowrap">
          {s.searchFlights}
        </button>
      </div>
    </div>
  );
}
