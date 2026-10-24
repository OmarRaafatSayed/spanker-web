"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { cn } from "@/lib/utils";
import {
  ChevronDown, X, ArrowLeftRight, Luggage, Briefcase,
  Users, Calendar, Search,
} from "lucide-react";

type TripType = "return" | "one-way" | "multi-city";
type TravelClass = "economy" | "premium_economy" | "business" | "first";

interface Passengers { adults: number; children: number; infants: number }

const CLASS_LABELS: Record<TravelClass, { ar: string; en: string }> = {
  economy:          { ar: "اقتصادية",          en: "Economy"           },
  premium_economy:  { ar: "اقتصادية مميزة",    en: "Premium Economy"   },
  business:         { ar: "رجال أعمال",         en: "Business"          },
  first:            { ar: "درجة أولى",          en: "First Class"       },
};

const TRIP_TYPES: { id: TripType; ar: string; en: string }[] = [
  { id: "return",     ar: "ذهاب وعودة", en: "Return"     },
  { id: "one-way",    ar: "ذهاب فقط",   en: "One-way"    },
  { id: "multi-city", ar: "متعدد المدن", en: "Multi-city" },
];

export function NewFlightSearchCard() {
  const { isRTL, locale } = useI18n();
  const isAr = locale === "ar";

  const [tripType, setTripType]   = useState<TripType>("return");
  const [travelClass, setClass]   = useState<TravelClass>("economy");
  const [from, setFrom]           = useState(isAr ? "القاهرة" : "Cairo");
  const [fromFixed, setFromFixed] = useState(true); // chip mode vs text mode
  const [to, setTo]               = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturn]   = useState("");
  const [pax, setPax]             = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [showPax, setShowPax]     = useState(false);
  const [showClass, setShowClass] = useState(false);
  const [showTrip, setShowTrip]   = useState(false);
  const [showBags, setShowBags]   = useState(false);
  const [bags, setBags]           = useState({ cabin: 0, checked: 0 });

  const totalPax = pax.adults + pax.children + pax.infants;

  function adjustPax(key: keyof Passengers, delta: number) {
    setPax((p) => {
      const min = key === "adults" ? 1 : 0;
      const max = key === "infants" ? p.adults : 9;
      return { ...p, [key]: Math.min(max, Math.max(min, p[key] + delta)) };
    });
  }

  function handleExplore() {
    const origin = from.trim().slice(0, 3).toUpperCase() || "CAI";
    const dest   = to.trim().slice(0, 3).toUpperCase()   || "";
    const base   = `/${locale}/book-flight`;
    const params = new URLSearchParams({ from: origin, ...(dest ? { to: dest } : {}) });
    window.location.href = `${base}?${params.toString()}`;
  }

  const chipBase = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150 whitespace-nowrap select-none";
  const chipIdle = "bg-white border-gray-200 text-gray-700 hover:border-brand-green/50 hover:bg-green-50/40";
  const chipOpen = "bg-green-50 border-brand-green/60 text-brand-green";

  const fieldBase = "flex flex-col justify-center px-4 py-3 cursor-text min-w-0 relative";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-visible">
      {/* ── Top chip strip ── */}
      <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-2xl">
        {/* Trip type */}
        <div className="relative">
          <button onClick={() => { setShowTrip(!showTrip); setShowPax(false); setShowClass(false); setShowBags(false); }}
            className={cn(chipBase, showTrip ? chipOpen : chipIdle)}>
            <span>{TRIP_TYPES.find(t => t.id === tripType)?.[isAr ? "ar" : "en"]}</span>
            <ChevronDown size={12} className={cn("transition-transform", showTrip && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showTrip && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full start-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[140px]">
                {TRIP_TYPES.map((t) => (
                  <button key={t.id} onClick={() => { setTripType(t.id); setShowTrip(false); }}
                    className={cn("w-full text-start px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0",
                      tripType === t.id ? "bg-green-50 text-brand-green font-semibold" : "text-gray-700 hover:bg-gray-50")}>
                    {isAr ? t.ar : t.en}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Travel class */}
        <div className="relative">
          <button onClick={() => { setShowClass(!showClass); setShowPax(false); setShowTrip(false); setShowBags(false); }}
            className={cn(chipBase, showClass ? chipOpen : chipIdle)}>
            <span>{CLASS_LABELS[travelClass][isAr ? "ar" : "en"]}</span>
            <ChevronDown size={12} className={cn("transition-transform", showClass && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showClass && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full start-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[170px]">
                {(Object.keys(CLASS_LABELS) as TravelClass[]).map((c) => (
                  <button key={c} onClick={() => { setClass(c); setShowClass(false); }}
                    className={cn("w-full text-start px-4 py-2.5 text-sm transition-colors border-b border-gray-50 last:border-0",
                      travelClass === c ? "bg-green-50 text-brand-green font-semibold" : "text-gray-700 hover:bg-gray-50")}>
                    {CLASS_LABELS[c][isAr ? "ar" : "en"]}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Passengers */}
        <div className="relative">
          <button onClick={() => { setShowPax(!showPax); setShowClass(false); setShowTrip(false); setShowBags(false); }}
            className={cn(chipBase, showPax ? chipOpen : chipIdle)}>
            <Users size={12} />
            <span>{totalPax} {isAr ? (totalPax === 1 ? "مسافر" : "مسافرون") : (totalPax === 1 ? "Passenger" : "Passengers")}</span>
            <ChevronDown size={12} className={cn("transition-transform", showPax && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showPax && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full start-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px]">
                {([
                  { key: "adults"   as const, labelAr: "بالغون",  labelEn: "Adults",   subAr: "١٢+ سنة",      subEn: "12+ yrs"   },
                  { key: "children" as const, labelAr: "أطفال",    labelEn: "Children", subAr: "٢–١١ سنة",     subEn: "2–11 yrs"  },
                  { key: "infants"  as const, labelAr: "رضّع",     labelEn: "Infants",  subAr: "أقل من سنتين", subEn: "Under 2"   },
                ]).map(({ key, labelAr, labelEn, subAr, subEn }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{isAr ? labelAr : labelEn}</p>
                      <p className="text-xs text-gray-400">{isAr ? subAr : subEn}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => adjustPax(key, -1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors text-base leading-none">−</button>
                      <span className="w-5 text-center text-sm font-bold text-gray-800">{pax[key]}</span>
                      <button onClick={() => adjustPax(key, 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green hover:text-brand-green transition-colors text-base leading-none">+</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowPax(false)}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white transition-colors"
                  style={{ background: BRAND_COLORS.green }}>
                  {isAr ? "تأكيد" : "Done"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bags */}
        <div className="relative">
          <button onClick={() => { setShowBags(!showBags); setShowPax(false); setShowClass(false); setShowTrip(false); }}
            className={cn(chipBase, showBags ? chipOpen : chipIdle)}>
            <Briefcase size={12} />
            <span>{bags.cabin}</span>
            <Luggage size={12} />
            <span>{bags.checked}</span>
            <ChevronDown size={12} className={cn("transition-transform", showBags && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showBags && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full start-0 mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px]">
                {([
                  { key: "cabin"   as const, Icon: Briefcase, labelAr: "حقيبة مقصورة", labelEn: "Cabin bag"      },
                  { key: "checked" as const, Icon: Luggage,   labelAr: "حقيبة مسجّلة",  labelEn: "Checked bag"    },
                ]).map(({ key, Icon: BagIcon, labelAr, labelEn }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <BagIcon size={14} className="text-gray-500" />
                      <p className="text-sm font-semibold text-gray-800">{isAr ? labelAr : labelEn}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setBags(b => ({ ...b, [key]: Math.max(0, b[key] - 1) }))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green transition-colors text-base leading-none">−</button>
                      <span className="w-4 text-center text-sm font-bold text-gray-800">{bags[key]}</span>
                      <button onClick={() => setBags(b => ({ ...b, [key]: Math.min(3, b[key] + 1) }))} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-green transition-colors text-base leading-none">+</button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowBags(false)}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white transition-colors"
                  style={{ background: BRAND_COLORS.green }}>
                  {isAr ? "تأكيد" : "Done"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fields row ── */}
      <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-gray-100 rtl:sm:divide-x-reverse">
        {/* From */}
        <div className={cn(fieldBase, "sm:flex-[1.1]")} onClick={() => !fromFixed && undefined}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            {isAr ? "من" : "From"}
          </span>
          {fromFixed ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: BRAND_COLORS.green }}>
                {from}
                <button onClick={() => setFromFixed(false)} aria-label="Remove origin">
                  <X size={11} />
                </button>
              </span>
            </div>
          ) : (
            <input
              autoFocus
              type="text"
              value={from}
              onChange={e => setFrom(e.target.value)}
              onBlur={() => { if (from.trim()) setFromFixed(true); }}
              placeholder={isAr ? "مطار أو مدينة" : "Airport or city"}
              className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-300 p-0"
            />
          )}
        </div>

        {/* Swap */}
        <div className="hidden sm:flex items-center justify-center w-8 shrink-0 border-x border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => { const t = from; setFrom(to); setTo(t); setFromFixed(!!to.trim()); }}
          role="button" aria-label={isAr ? "تبديل الاتجاه" : "Swap origin and destination"}>
          <ArrowLeftRight size={14} className="text-gray-400" />
        </div>

        {/* To */}
        <div className={cn(fieldBase, "sm:flex-[1.1] border-t border-gray-100 sm:border-t-0")}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            {isAr ? "إلى" : "To"}
          </span>
          <input
            type="text"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder={isAr ? "مدينة أو مطار أو مكان" : "City, airport or place"}
            className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-300 p-0"
          />
        </div>

        {/* Departure */}
        <div className={cn(fieldBase, "sm:flex-1 border-t border-gray-100 sm:border-t-0")}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            {isAr ? "المغادرة" : "Departure"}
          </span>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={departure}
              onChange={e => setDeparture(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 p-0 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0"
            />
            {!departure && (
              <span className="absolute text-sm font-semibold text-gray-800 pointer-events-none" style={{ left: "2.5rem", top: "50%", transform: "translateY(-2px)" }}>
                {isAr ? "أي وقت" : "Anytime"}
              </span>
            )}
          </div>
        </div>

        {/* Return — only for round-trip */}
        <AnimatePresence>
          {tripType === "return" && (
            <motion.div
              className={cn(fieldBase, "sm:flex-1 border-t border-gray-100 sm:border-t-0")}
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                {isAr ? "العودة" : "Return"}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturn(e.target.value)}
                  min={departure || new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-800 p-0 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                {!returnDate && (
                  <span className="absolute text-sm font-semibold text-gray-800 pointer-events-none" style={{ left: "2.5rem", top: "50%", transform: "translateY(-2px)" }}>
                    {isAr ? "أي وقت" : "Anytime"}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explore button */}
        <button
          onClick={handleExplore}
          className="flex items-center justify-center gap-2 font-bold text-sm text-white px-6 py-4 sm:py-0 sm:rounded-none rounded-b-2xl sm:rounded-e-2xl transition-all duration-200 hover:opacity-90 active:scale-[0.98] shrink-0"
          style={{ background: BRAND_COLORS.green, minWidth: "110px" }}
        >
          <Search size={16} />
          {isAr ? "استكشف" : "Explore"}
        </button>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-100 bg-gray-50/40 rounded-b-2xl">
        <input
          type="checkbox"
          id="accom-deals"
          className="w-3.5 h-3.5 rounded accent-brand-green cursor-pointer"
        />
        <label htmlFor="accom-deals" className="text-xs text-gray-500 cursor-pointer select-none">
          {isAr ? "إظهار عروض الإقامة" : "Show accommodation deals"}
        </label>
      </div>
    </div>
  );
}
