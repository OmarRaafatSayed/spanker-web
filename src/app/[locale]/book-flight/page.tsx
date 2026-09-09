"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookingWizardShell,
  WizardCard,
  WizardSectionTitle,
  WizardNavButtons,
  WizardError,
  WizardSuccess,
} from "@/components/booking/BookingWizardShell";
import { useBookingWizard } from "@/hooks/useBookingWizard";

const STEPS = [
  { id: "search",     label: "Search",     labelAr: "البحث" },
  { id: "select",     label: "Select",     labelAr: "الاختيار" },
  { id: "passengers", label: "Passengers", labelAr: "الركاب" },
  { id: "review",     label: "Review",     labelAr: "المراجعة" },
  { id: "done",       label: "Done",       labelAr: "تأكيد" },
];

interface PassengerDetail {
  title: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number: string;
  passport_expiry: string;
  nationality: string;
}

interface FlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  class: "economy" | "business" | "first";
  passengers: number;
  tripType: "one-way" | "round-trip";
  selectedFlight: any | null;
  passengerDetails: PassengerDetail[];
  contactEmail: string;
  contactPhone: string;
  specialRequests: string;
  booking: any | null;
}

const INITIAL: FlightData = {
  origin: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  class: "economy",
  passengers: 1,
  tripType: "one-way",
  selectedFlight: null,
  passengerDetails: [
    {
      title: "mr",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      passport_number: "",
      passport_expiry: "",
      nationality: "EG",
    },
  ],
  contactEmail: "",
  contactPhone: "",
  specialRequests: "",
  booking: null,
};

const AIRPORTS: Record<string, string> = {
  CAI: "القاهرة",
  HRG: "الغردقة",
  SSH: "شرم الشيخ",
  RMF: "مرسى علم",
  LXR: "الأقصر",
  ASW: "أسوان",
  SKV: "سانت كاترين",
  DXB: "دبي",
  RUH: "الرياض",
  JED: "جدة",
  IST: "إسطنبول",
  LHR: "لندن",
  CDG: "باريس",
};

const CLASS_LABELS: Record<string, string> = {
  economy: "اقتصادية",
  business: "أعمال",
  first: "أولى",
};

export default function BookFlightPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";

  const {
    currentStep,
    steps,
    data,
    isFirst,
    isLast,
    isSubmitting,
    error,
    next,
    back,
    updateData,
    setIsSubmitting,
    setError,
  } = useBookingWizard<FlightData>(STEPS, INITIAL);

  const [flights, setFlights] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [originFocus, setOriginFocus] = useState(false);
  const [destFocus, setDestFocus] = useState(false);

  function syncPassengers(count: number) {
    const arr = Array.from(
      { length: count },
      (_, i) =>
        data.passengerDetails[i] ?? {
          title: "mr",
          first_name: "",
          last_name: "",
          date_of_birth: "",
          passport_number: "",
          passport_expiry: "",
          nationality: "EG",
        }
    );
    updateData({ passengers: count, passengerDetails: arr });
  }

  async function handleSearch() {
    if (!data.origin || !data.destination || !data.departureDate) {
      setError("يرجى تعبئة حقول المطار والتاريخ");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        origin: data.origin,
        destination: data.destination,
        departureDate: data.departureDate,
        class: data.class,
        passengers: String(data.passengers),
        tripType: data.tripType,
      });
      const res = await fetch(`/api/v1/flights/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setFlights(json.data?.outbound || []);
      next();
    } catch (e: any) {
      setError(e.message || "فشل البحث عن رحلات");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "flight",
          data: {
            flight_id: data.selectedFlight?.id,
            passengers: data.passengerDetails,
            contact: { email: data.contactEmail, phone: data.contactPhone },
            special_requests: data.specialRequests || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      updateData({ booking: json.data });
      next();
    } catch (e: any) {
      setError(e.message || "فشل إتمام الحجز");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (currentStep === 0) { handleSearch(); return; }
    if (currentStep === 1 && !data.selectedFlight) { setError("يرجى اختيار رحلة"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null);
    next();
  }

  const durationLabel = (dep: string, arr: string) => {
    if (!dep || !arr) return "";
    const diff = new Date(arr).getTime() - new Date(dep).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h}س ${m}د`;
  };

  const filteredAirports = (q: string) =>
    Object.entries(AIRPORTS).filter(
      ([code, name]) =>
        code.includes(q.toUpperCase()) || name.includes(q)
    );

  return (
    <BookingWizardShell
      steps={steps}
      currentStep={currentStep}
      title="Flight Booking"
      titleAr="حجز رحلة طيران"
      locale={locale as "ar" | "en"}
    >
      <WizardError message={error} />

      {/* ── STEP 0: SEARCH ── */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* Trip type toggle */}
          <div className="flex gap-2 bg-white rounded-2xl border border-border-light p-2">
            {(["one-way", "round-trip"] as const).map((type) => (
              <button
                key={type}
                onClick={() => updateData({ tripType: type })}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  data.tripType === type
                    ? "bg-brand-green text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {type === "one-way" ? "✈ ذهاب فقط" : "↔ ذهاب وعودة"}
              </button>
            ))}
          </div>

          <WizardCard>
            {/* Origin / Destination row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative">
                <label className="block text-xs font-medium text-text-muted mb-1">
                  🛫 من
                </label>
                <input
                  value={data.origin}
                  onChange={(e) => updateData({ origin: e.target.value.toUpperCase() })}
                  onFocus={() => setOriginFocus(true)}
                  onBlur={() => setTimeout(() => setOriginFocus(false), 200)}
                  placeholder="CAI"
                  maxLength={3}
                  className="w-full h-12 px-3 rounded-xl border border-border-default text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green uppercase bg-muted"
                />
                {data.origin && AIRPORTS[data.origin] && (
                  <p className="text-xs text-brand-green mt-0.5 pr-1">{AIRPORTS[data.origin]}</p>
                )}
                {originFocus && data.origin.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border-light rounded-xl shadow-lg z-30 overflow-hidden">
                    {filteredAirports(data.origin).slice(0, 5).map(([code, name]) => (
                      <button
                        key={code}
                        onMouseDown={() => updateData({ origin: code })}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-brand-green/5 flex justify-between items-center"
                      >
                        <span className="font-mono font-bold text-brand-green">{code}</span>
                        <span className="text-text-secondary">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-text-muted mb-1">
                  🛬 إلى
                </label>
                <input
                  value={data.destination}
                  onChange={(e) => updateData({ destination: e.target.value.toUpperCase() })}
                  onFocus={() => setDestFocus(true)}
                  onBlur={() => setTimeout(() => setDestFocus(false), 200)}
                  placeholder="DXB"
                  maxLength={3}
                  className="w-full h-12 px-3 rounded-xl border border-border-default text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green uppercase bg-muted"
                />
                {data.destination && AIRPORTS[data.destination] && (
                  <p className="text-xs text-brand-green mt-0.5 pr-1">{AIRPORTS[data.destination]}</p>
                )}
                {destFocus && data.destination.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border-light rounded-xl shadow-lg z-30 overflow-hidden">
                    {filteredAirports(data.destination).slice(0, 5).map(([code, name]) => (
                      <button
                        key={code}
                        onMouseDown={() => updateData({ destination: code })}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-brand-green/5 flex justify-between items-center"
                      >
                        <span className="font-mono font-bold text-brand-green">{code}</span>
                        <span className="text-text-secondary">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Popular routes */}
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">وجهات مقترحة</p>
              <div className="flex flex-wrap gap-2">
                {[["CAI","DXB"],["HRG","CAI"],["SSH","CAI"],["CAI","RUH"],["CAI","IST"]].map(([o, d]) => (
                  <button
                    key={`${o}-${d}`}
                    onClick={() => updateData({ origin: o, destination: d })}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border-light hover:border-brand-green/40 hover:bg-brand-green/5 text-text-secondary transition-all"
                  >
                    {o} → {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">📅 تاريخ المغادرة</label>
                <input
                  type="date"
                  value={data.departureDate}
                  onChange={(e) => updateData({ departureDate: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              {data.tripType === "round-trip" && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">📅 تاريخ العودة</label>
                  <input
                    type="date"
                    value={data.returnDate}
                    onChange={(e) => updateData({ returnDate: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">💺 الدرجة</label>
                <select
                  value={data.class}
                  onChange={(e) => updateData({ class: e.target.value as FlightData["class"] })}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  <option value="economy">اقتصادية</option>
                  <option value="business">أعمال</option>
                  <option value="first">أولى</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">👤 عدد المسافرين</label>
                <select
                  value={data.passengers}
                  onChange={(e) => syncPassengers(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "راكب" : "ركاب"}</option>
                  ))}
                </select>
              </div>
            </div>

            <WizardNavButtons
              onBack={back}
              onNext={handleNext}
              isFirst={isFirst}
              isLast={false}
              isSubmitting={searching}
              nextLabel={searching ? "جاري البحث..." : "🔍 بحث عن رحلات"}
            />
          </WizardCard>
        </div>
      )}

      {/* ── STEP 1: SELECT FLIGHT ── */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle
            ar={`نتائج البحث (${flights.length} رحلة)`}
            en={`Search Results (${flights.length} flights)`}
          />
          {flights.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">✈️</div>
              <p className="text-text-muted">لا توجد رحلات متاحة لهذا الطريق</p>
              <button
                onClick={() => back()}
                className="mt-4 px-4 py-2 text-sm text-brand-green font-medium hover:underline"
              >
                تعديل البحث
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {flights.map((f: any) => (
                <div
                  key={f.id}
                  onClick={() => updateData({ selectedFlight: f })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    data.selectedFlight?.id === f.id
                      ? "border-brand-green bg-brand-green/5"
                      : "border-border-light hover:border-brand-green/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-text-primary">{f.airline}</span>
                      <span className="text-text-muted text-xs mr-2 bg-muted px-2 py-0.5 rounded">{f.flight_number}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-bold text-brand-green">
                        {(f.base_price + f.taxes_amount).toLocaleString()} ج.م
                      </span>
                      <span className="block text-xs text-text-muted">للشخص</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-text-primary text-base">
                        {new Date(f.departure_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{f.origin_iata}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center text-text-muted">
                      <span className="text-xs">{durationLabel(f.departure_at, f.arrival_at)}</span>
                      <div className="w-full flex items-center gap-1">
                        <div className="flex-1 h-px bg-border-default" />
                        <span className="text-brand-green">✈</span>
                        <div className="flex-1 h-px bg-border-default" />
                      </div>
                      <span className="text-xs">{f.stops === 0 ? "مباشر" : `${f.stops} توقف`}</span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-text-primary text-base">
                        {f.arrival_at
                          ? new Date(f.arrival_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </p>
                      <p className="text-xs text-text-muted font-mono">{f.destination_iata}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 pt-2 border-t border-border-light text-xs text-text-muted">
                    <span>🧳 {f.baggage_kg} كجم</span>
                    <span>💺 {CLASS_LABELS[f.class] || f.class}</span>
                    <span>{f.seats_available} مقعد متاح</span>
                    {f.refundable && <span className="text-brand-green font-medium">✓ قابل للاسترداد</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 2: PASSENGERS ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.passengerDetails.map((p, i) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`الراكب ${i + 1}`} en={`Passenger ${i + 1}`} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
                  <select
                    value={p.title}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], title: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  >
                    <option value="mr">السيد</option>
                    <option value="ms">الآنسة</option>
                    <option value="mrs">السيدة</option>
                    <option value="dr">الدكتور</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأول</label>
                  <input
                    value={p.first_name}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], first_name: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
                  <input
                    value={p.last_name}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], last_name: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={p.date_of_birth}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], date_of_birth: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">رقم الجواز</label>
                  <input
                    value={p.passport_number}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], passport_number: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">انتهاء الجواز</label>
                  <input
                    type="date"
                    value={p.passport_expiry}
                    onChange={(e) => {
                      const arr = [...data.passengerDetails];
                      arr[i] = { ...arr[i], passport_expiry: e.target.value };
                      updateData({ passengerDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
              </div>
            </WizardCard>
          ))}

          <WizardCard>
            <WizardSectionTitle ar="بيانات التواصل" en="Contact Details" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => updateData({ contactEmail: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={data.contactPhone}
                  onChange={(e) => updateData({ contactPhone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">طلبات خاصة (اختياري)</label>
                <textarea
                  rows={2}
                  value={data.specialRequests}
                  onChange={(e) => updateData({ specialRequests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
                />
              </div>
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {currentStep === 3 && data.selectedFlight && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            {/* Flight summary */}
            <div className="bg-gradient-to-r from-brand-green/8 to-brand-green/4 rounded-xl p-4 border border-brand-green/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary">{data.selectedFlight.airline}</span>
                <span className="text-xs bg-white text-brand-green font-mono font-bold px-2 py-0.5 rounded">
                  {data.selectedFlight.flight_number}
                </span>
              </div>
              <div className="flex items-center gap-3 text-text-secondary text-sm">
                <span className="font-mono font-bold">{data.selectedFlight.origin_iata}</span>
                <span className="text-brand-green">✈</span>
                <span className="font-mono font-bold">{data.selectedFlight.destination_iata}</span>
                <span className="text-text-muted">•</span>
                <span>{new Date(data.selectedFlight.departure_at).toLocaleDateString("ar-EG", { weekday: "short", day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {CLASS_LABELS[data.selectedFlight.class]} • {data.passengers} {data.passengers === 1 ? "راكب" : "ركاب"} • {data.selectedFlight.baggage_kg} كجم أمتعة
              </p>
            </div>

            {/* Passengers summary */}
            <div>
              <p className="text-xs font-bold text-text-muted mb-2">الركاب</p>
              <div className="space-y-1">
                {data.passengerDetails.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm text-text-secondary py-1 border-b border-border-light last:border-0">
                    <span>{i + 1}. {p.first_name} {p.last_name}</span>
                    <span className="text-text-muted font-mono text-xs">{p.passport_number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center border-t pt-3">
              <div className="text-sm text-text-muted">
                <p>{(data.selectedFlight.base_price + data.selectedFlight.taxes_amount).toLocaleString()} ج.م × {data.passengers}</p>
              </div>
              <span className="text-2xl font-bold text-brand-green">
                {((data.selectedFlight.base_price + data.selectedFlight.taxes_amount) * data.passengers).toLocaleString()} ج.م
              </span>
            </div>

            <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 text-sm text-text-secondary">
              <strong>💳 طريقة الدفع:</strong> كاش أو تحويل بنكي — سيتواصل معك فريقنا
            </div>
          </div>
          <WizardNavButtons
            onBack={back}
            onNext={handleNext}
            isFirst={isFirst}
            isLast={true}
            isSubmitting={isSubmitting}
            submitLabel="✅ تأكيد الحجز"
          />
        </WizardCard>
      )}

      {/* ── STEP 4: DONE ── */}
      {currentStep === 4 && data.booking && (
        <WizardCard>
          <WizardSuccess
            reference={data.booking.reference}
            message="Flight Booked!"
            messageAr="🎉 تم حجز رحلتك بنجاح!"
            expiresAt={data.booking.expires_at}
            locale={locale as "ar" | "en"}
            onDone={() => router.push(`/${locale}/my-booking`)}
          />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
