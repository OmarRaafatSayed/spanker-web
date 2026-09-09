"use client";

import { useEffect, useState } from "react";
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
  { id: "browse",    label: "Browse",    labelAr: "تصفح" },
  { id: "details",   label: "Details",   labelAr: "التفاصيل" },
  { id: "travelers", label: "Travelers", labelAr: "المسافرون" },
  { id: "review",    label: "Review",    labelAr: "المراجعة" },
  { id: "done",      label: "Done",      labelAr: "تأكيد" },
];

interface Traveler {
  title: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

interface TourData {
  destination: string;
  difficulty: string;
  start_date_from: string;
  start_date_to: string;
  max_price: string;
  selectedTrip: any | null;
  travelers: Traveler[];
  contactEmail: string;
  contactPhone: string;
  specialRequests: string;
  dietaryRequirements: string;
  booking: any | null;
}

const INITIAL: TourData = {
  destination: "",
  difficulty: "",
  start_date_from: "",
  start_date_to: "",
  max_price: "",
  selectedTrip: null,
  travelers: [
    {
      title: "mr",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      nationality: "EG",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  ],
  contactEmail: "",
  contactPhone: "",
  specialRequests: "",
  dietaryRequirements: "",
  booking: null,
};

const DIFFICULTY_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  easy:       { label: "سهل",    color: "bg-green-100 text-green-700",  icon: "🟢", desc: "مناسب للجميع" },
  moderate:   { label: "متوسط",  color: "bg-yellow-100 text-yellow-700", icon: "🟡", desc: "لياقة بدنية متوسطة" },
  challenging:{ label: "صعب",   color: "bg-red-100 text-red-700",      icon: "🔴", desc: "رياضيون فقط" },
};

const POPULAR_DESTINATIONS = [
  { name: "مرسى علم",    icon: "🐠" },
  { name: "الأقصر",      icon: "🏛️" },
  { name: "أسوان",       icon: "⛵" },
  { name: "سيوة",        icon: "🌴" },
  { name: "شرم الشيخ",  icon: "🤿" },
  { name: "الغردقة",     icon: "🏖️" },
  { name: "سانت كاترين", icon: "⛰️" },
  { name: "الفيوم",      icon: "🌊" },
];

function TripCard({
  trip,
  selected,
  onSelect,
}: {
  trip: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_META[trip.difficulty] ?? { label: trip.difficulty, color: "bg-muted text-text-muted", icon: "⚪", desc: "" };

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        selected ? "border-brand-green shadow-md" : "border-border-light hover:border-brand-green/40 hover:shadow-sm"
      }`}
    >
      {/* Main selectable area */}
      <div
        className={`p-4 cursor-pointer ${selected ? "bg-brand-green/5" : ""}`}
        onClick={onSelect}
      >
        {/* Top row */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-text-primary leading-tight">{trip.title_ar}</p>
              {selected && (
                <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full shrink-0">محدد ✓</span>
              )}
            </div>
            <p className="text-sm text-text-muted">📍 {trip.destination} • {trip.duration_days} أيام</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diff.color}`}>
                {diff.icon} {diff.label}
              </span>
              <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full">
                👥 {trip.spots_available} مقعد متاح
              </span>
              {trip.includes?.includes("نقل") && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🚌 نقل مشمول</span>
              )}
              {trip.includes?.includes("إقامة") && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">🏨 إقامة مشمولة</span>
              )}
            </div>
          </div>
          <div className="text-left shrink-0">
            <p className="text-xl font-bold text-brand-green">{trip.price_per_person?.toLocaleString()}</p>
            <p className="text-xs text-text-muted">ج.م / شخص</p>
          </div>
        </div>

        {/* Date row */}
        <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
          <span>🗓 {trip.start_date}</span>
          <span>→</span>
          <span>{trip.end_date}</span>
        </div>
      </div>

      {/* Expand toggle */}
      <div className="border-t border-border-light">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-brand-green font-medium hover:bg-brand-green/5 transition-all"
        >
          <span>{expanded ? "إخفاء البرنامج التفصيلي" : "عرض البرنامج والتفاصيل"}</span>
          <span>{expanded ? "▲" : "▼"}</span>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Itinerary */}
            {trip.itinerary?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-primary mb-2">البرنامج اليومي</p>
                <div className="space-y-1.5">
                  {trip.itinerary.map((day: any) => (
                    <div key={day.day} className="flex gap-2 text-sm">
                      <span className="shrink-0 w-16 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-lg text-center">
                        يوم {day.day}
                      </span>
                      <div>
                        <span className="font-medium text-text-primary">{day.title}</span>
                        {day.description && (
                          <span className="text-text-muted"> — {day.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Includes / Excludes */}
            {(trip.includes?.length > 0 || trip.excludes?.length > 0) && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-light">
                {trip.includes?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-green-700 mb-1">✓ يشمل</p>
                    {trip.includes.map((item: string, i: number) => (
                      <p key={i} className="text-xs text-text-secondary">• {item}</p>
                    ))}
                  </div>
                )}
                {trip.excludes?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-red-600 mb-1">✗ لا يشمل</p>
                    {trip.excludes.map((item: string, i: number) => (
                      <p key={i} className="text-xs text-text-secondary">• {item}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Meeting point */}
            {trip.meeting_point && (
              <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg p-2 text-xs text-text-secondary">
                📍 نقطة التجمع: <strong>{trip.meeting_point}</strong>
                {trip.meeting_time && <> الساعة <strong>{trip.meeting_time}</strong></>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToursPage() {
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
  } = useBookingWizard<TourData>(STEPS, INITIAL);

  const [trips, setTrips]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrips({});
  }, []);

  async function fetchTrips(filters: {
    destination?: string;
    difficulty?: string;
    start_date_from?: string;
    start_date_to?: string;
    max_price?: string;
  }) {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.destination)    q.set("destination",    filters.destination);
      if (filters.difficulty)     q.set("difficulty",     filters.difficulty);
      if (filters.start_date_from)q.set("start_date_from",filters.start_date_from);
      if (filters.start_date_to)  q.set("start_date_to",  filters.start_date_to);
      if (filters.max_price)      q.set("max_price",      filters.max_price);
      const res  = await fetch(`/api/v1/trips/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setTrips(json.data || []);
    } catch (e: any) {
      setError(e.message || "فشل تحميل الرحلات السياحية");
    } finally {
      setLoading(false);
    }
  }

  function syncTravelers(count: number) {
    const arr = Array.from(
      { length: count },
      (_, i) =>
        data.travelers[i] ?? {
          title: "mr",
          first_name: "",
          last_name: "",
          date_of_birth: "",
          nationality: "EG",
          emergency_contact_name: "",
          emergency_contact_phone: "",
        }
    );
    updateData({ travelers: arr });
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res  = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "trip",
          data: {
            trip_id: data.selectedTrip?.id,
            travelers: data.travelers,
            contact: { email: data.contactEmail, phone: data.contactPhone },
            special_requests: data.specialRequests || undefined,
            dietary_requirements: data.dietaryRequirements || undefined,
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
    if (currentStep === 0 && !data.selectedTrip) { setError("يرجى اختيار رحلة سياحية"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null);
    next();
  }

  const totalPrice = data.selectedTrip
    ? data.selectedTrip.price_per_person * data.travelers.length
    : 0;

  return (
    <BookingWizardShell
      steps={steps}
      currentStep={currentStep}
      title="Tours"
      titleAr="رحلات سياحية"
      locale={locale as "ar" | "en"}
    >
      <WizardError message={error} />

      {/* ── STEP 0: BROWSE & SELECT ── */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* Filter card */}
          <WizardCard>
            <WizardSectionTitle ar="اكتشف رحلاتنا" en="Discover Our Tours" />

            {/* Popular destinations */}
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">وجهات شائعة</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_DESTINATIONS.map(({ name, icon }) => (
                  <button
                    key={name}
                    onClick={() => updateData({ destination: name })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      data.destination === name
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-border-light hover:border-brand-green/40 text-text-secondary"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty chips */}
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">مستوى الصعوبة</p>
              <div className="flex gap-2">
                <button
                  onClick={() => updateData({ difficulty: "" })}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                    data.difficulty === ""
                      ? "border-brand-green bg-brand-green/10 text-brand-green"
                      : "border-border-light text-text-secondary hover:border-brand-green/40"
                  }`}
                >
                  الكل
                </button>
                {Object.entries(DIFFICULTY_META).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => updateData({ difficulty: key })}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      data.difficulty === key
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-border-light text-text-secondary hover:border-brand-green/40"
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">📅 من تاريخ</label>
                <input
                  type="date"
                  value={data.start_date_from}
                  onChange={(e) => updateData({ start_date_from: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">📅 إلى تاريخ</label>
                <input
                  type="date"
                  value={data.start_date_to}
                  onChange={(e) => updateData({ start_date_to: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">💰 الحد الأقصى للسعر / شخص (اختياري)</label>
                <input
                  type="number"
                  value={data.max_price}
                  onChange={(e) => updateData({ max_price: e.target.value })}
                  placeholder="بالجنيه المصري"
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
            </div>

            <button
              onClick={() =>
                fetchTrips({
                  destination:     data.destination,
                  difficulty:      data.difficulty,
                  start_date_from: data.start_date_from,
                  start_date_to:   data.start_date_to,
                  max_price:       data.max_price,
                })
              }
              disabled={loading}
              className="w-full py-2 rounded-xl bg-brand-green/10 text-brand-green text-sm font-bold hover:bg-brand-green/20 transition-all disabled:opacity-50"
            >
              {loading ? "🔄 جاري البحث..." : "🔍 تطبيق الفلتر"}
            </button>
          </WizardCard>

          {/* Results */}
          <WizardCard>
            <WizardSectionTitle
              ar={`الرحلات المتاحة (${trips.length})`}
              en={`Available Tours (${trips.length})`}
            />

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border-light p-4">
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🗺️</div>
                <p className="text-text-muted">لا توجد رحلات بهذه المعايير</p>
                <button
                  onClick={() => fetchTrips({})}
                  className="mt-3 text-sm text-brand-green font-medium hover:underline"
                >
                  عرض كل الرحلات
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((t: any) => (
                  <TripCard
                    key={t.id}
                    trip={t}
                    selected={data.selectedTrip?.id === t.id}
                    onSelect={() => updateData({ selectedTrip: t })}
                  />
                ))}
              </div>
            )}
          </WizardCard>

          <WizardNavButtons
            onBack={back}
            onNext={handleNext}
            isFirst={isFirst}
            isLast={false}
            nextLabel="متابعة لتحديد المسافرين"
          />
        </div>
      )}

      {/* ── STEP 1: TRIP DETAILS + TRAVELER COUNT ── */}
      {currentStep === 1 && data.selectedTrip && (
        <WizardCard>
          <WizardSectionTitle ar="تفاصيل الرحلة" en="Trip Details" />

          {/* Hero summary */}
          <div className="bg-gradient-to-r from-brand-green/10 to-brand-yellow/10 rounded-xl p-4 border border-brand-green/20 mb-4">
            <p className="font-bold text-brand-green text-lg leading-tight">{data.selectedTrip.title_ar}</p>
            <p className="text-sm text-text-secondary mt-1">
              📍 {data.selectedTrip.destination} • {data.selectedTrip.duration_days} أيام •{" "}
              {DIFFICULTY_META[data.selectedTrip.difficulty]?.label ?? data.selectedTrip.difficulty}
            </p>
            <p className="text-sm text-text-secondary">
              🗓 {data.selectedTrip.start_date} — {data.selectedTrip.end_date}
            </p>
            {data.selectedTrip.meeting_point && (
              <p className="text-xs text-text-muted mt-1">
                📍 نقطة التجمع: {data.selectedTrip.meeting_point} {data.selectedTrip.meeting_time && `الساعة ${data.selectedTrip.meeting_time}`}
              </p>
            )}
          </div>

          {/* What's included */}
          {(data.selectedTrip.includes?.length > 0 || data.selectedTrip.excludes?.length > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              {data.selectedTrip.includes?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="font-bold text-green-700 mb-1.5">✓ يشمل</p>
                  {data.selectedTrip.includes.map((item: string, i: number) => (
                    <p key={i} className="text-green-700">• {item}</p>
                  ))}
                </div>
              )}
              {data.selectedTrip.excludes?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="font-bold text-red-600 mb-1.5">✗ لا يشمل</p>
                  {data.selectedTrip.excludes.map((item: string, i: number) => (
                    <p key={i} className="text-red-600">• {item}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Traveler count */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              👥 عدد المسافرين
            </label>
            <select
              value={data.travelers.length}
              onChange={(e) => syncTravelers(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            >
              {Array.from(
                { length: Math.min(10, data.selectedTrip.spots_available || 10) },
                (_, i) => i + 1
              ).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "مسافر" : "مسافرين"}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {data.selectedTrip.spots_available} مقعد متاح
            </p>
          </div>

          {/* Live total */}
          <div className="flex justify-between items-center bg-brand-green/8 rounded-xl px-4 py-3 mt-3">
            <span className="text-sm text-text-secondary">
              {data.selectedTrip.price_per_person?.toLocaleString()} ج.م × {data.travelers.length}
            </span>
            <span className="text-xl font-bold text-brand-green">
              {(data.selectedTrip.price_per_person * data.travelers.length).toLocaleString()} ج.م
            </span>
          </div>

          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 2: TRAVELER DETAILS ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.travelers.map((t, i) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`المسافر ${i + 1}`} en={`Traveler ${i + 1}`} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
                  <select
                    value={t.title}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], title: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  >
                    <option value="mr">السيد</option>
                    <option value="ms">الآنسة</option>
                    <option value="mrs">السيدة</option>
                    <option value="dr">د.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأول</label>
                  <input
                    value={t.first_name}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], first_name: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
                  <input
                    value={t.last_name}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], last_name: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={t.date_of_birth}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], date_of_birth: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-muted mb-1">الجنسية (ISO)</label>
                  <input
                    value={t.nationality}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], nationality: e.target.value.toUpperCase() };
                      updateData({ travelers: arr });
                    }}
                    maxLength={2}
                    placeholder="EG"
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Emergency contact */}
              <div className="mt-3 pt-3 border-t border-border-light grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">🚨 جهة طوارئ</label>
                  <input
                    value={t.emergency_contact_name}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], emergency_contact_name: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    placeholder="اسم الشخص"
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">هاتف الطوارئ</label>
                  <input
                    type="tel"
                    value={t.emergency_contact_phone}
                    onChange={(e) => {
                      const arr = [...data.travelers];
                      arr[i] = { ...arr[i], emergency_contact_phone: e.target.value };
                      updateData({ travelers: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
              </div>
            </WizardCard>
          ))}

          {/* Contact + extras */}
          <WizardCard>
            <WizardSectionTitle ar="بيانات التواصل والتفضيلات" en="Contact & Preferences" />
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
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">🥗 متطلبات غذائية</label>
                <input
                  value={data.dietaryRequirements}
                  onChange={(e) => updateData({ dietaryRequirements: e.target.value })}
                  placeholder="حلال، نباتي، خالٍ من الجلوتين..."
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">طلبات خاصة</label>
                <input
                  value={data.specialRequests}
                  onChange={(e) => updateData({ specialRequests: e.target.value })}
                  placeholder="احتياجات خاصة، مساعدة..."
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
            </div>
          </WizardCard>

          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {currentStep === 3 && data.selectedTrip && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            {/* Trip hero */}
            <div className="bg-gradient-to-r from-brand-green/8 to-brand-yellow/8 rounded-xl p-4 border border-brand-green/20">
              <p className="font-bold text-text-primary text-base">{data.selectedTrip.title_ar}</p>
              <p className="text-sm text-text-secondary">
                📍 {data.selectedTrip.destination} • {data.selectedTrip.duration_days} أيام
              </p>
              <p className="text-sm text-text-secondary">
                🗓 {data.selectedTrip.start_date} — {data.selectedTrip.end_date}
              </p>
            </div>

            {/* Traveler list */}
            <div>
              <p className="text-xs font-bold text-text-muted mb-2">
                المسافرون ({data.travelers.length})
              </p>
              <div className="space-y-1">
                {data.travelers.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-text-secondary py-1 border-b border-border-light last:border-0"
                  >
                    <span className="w-5 h-5 rounded-full bg-brand-green/10 text-brand-green text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{t.first_name} {t.last_name}</span>
                    <span className="text-text-muted text-xs mr-auto font-mono">{t.nationality}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>{data.selectedTrip.price_per_person?.toLocaleString()} ج.م × {data.travelers.length} مسافر</span>
                <span>{totalPrice.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-light">
                <span className="font-bold text-text-primary">الإجمالي</span>
                <span className="text-2xl font-bold text-brand-green">{totalPrice.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* Extras summary */}
            {(data.dietaryRequirements || data.specialRequests) && (
              <div className="bg-muted rounded-xl p-3 text-xs text-text-secondary space-y-1">
                {data.dietaryRequirements && <p>🥗 {data.dietaryRequirements}</p>}
                {data.specialRequests && <p>📝 {data.specialRequests}</p>}
              </div>
            )}

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
            message="Tour Booking Confirmed!"
            messageAr="🎉 تم تسجيل حجز الرحلة السياحية بنجاح!"
            expiresAt={data.booking.expires_at}
            locale={locale as "ar" | "en"}
            onDone={() => router.push(`/${locale}/my-booking`)}
          />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
