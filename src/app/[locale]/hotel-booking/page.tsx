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
  { id: "search",  label: "Search",  labelAr: "البحث" },
  { id: "select",  label: "Select",  labelAr: "الاختيار" },
  { id: "guests",  label: "Guests",  labelAr: "النزلاء" },
  { id: "review",  label: "Review",  labelAr: "المراجعة" },
  { id: "done",    label: "Done",    labelAr: "تأكيد" },
];

interface GuestDetail {
  title: string;
  first_name: string;
  last_name: string;
}

interface HotelData {
  city: string;
  checkin: string;
  checkout: string;
  guests: number;
  rooms: number;
  room_type: "standard" | "deluxe" | "suite";
  min_stars: number;
  max_price: string;
  selectedHotel: any | null;
  guestDetails: GuestDetail[];
  contactEmail: string;
  contactPhone: string;
  specialRequests: string;
  booking: any | null;
}

const INITIAL: HotelData = {
  city: "",
  checkin: "",
  checkout: "",
  guests: 1,
  rooms: 1,
  room_type: "standard",
  min_stars: 0,
  max_price: "",
  selectedHotel: null,
  guestDetails: [{ title: "mr", first_name: "", last_name: "" }],
  contactEmail: "",
  contactPhone: "",
  specialRequests: "",
  booking: null,
};

const POPULAR_CITIES = [
  "شرم الشيخ",
  "الغردقة",
  "مرسى علم",
  "الأقصر",
  "أسوان",
  "القاهرة",
  "الإسكندرية",
  "سيوة",
];

const ROOM_LABELS: Record<string, string> = {
  standard: "عادية",
  deluxe: "ديلوكس",
  suite: "جناح",
};

const BOARD_LABELS: Record<string, string> = {
  room_only: "غرفة فقط",
  bed_breakfast: "إفطار مشمول",
  half_board: "نصف إقامة",
  full_board: "إقامة كاملة",
};

const AMENITY_ICONS: Record<string, string> = {
  "wifi": "📶",
  "pool": "🏊",
  "gym": "🏋️",
  "spa": "💆",
  "restaurant": "🍽️",
  "beach": "🏖️",
  "parking": "🅿️",
  "bar": "🍹",
};

function AmenityTag({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const icon = Object.entries(AMENITY_ICONS).find(([k]) => lower.includes(k))?.[1] ?? "✓";
  return (
    <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full flex items-center gap-1">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(Math.min(stars, 5))}
      {"☆".repeat(Math.max(0, 5 - stars))}
    </span>
  );
}

export default function HotelBookingPage() {
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
  } = useBookingWizard<HotelData>(STEPS, INITIAL);

  const [hotels, setHotels] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);

  const nights =
    data.checkin && data.checkout
      ? Math.max(
          1,
          Math.ceil(
            (new Date(data.checkout).getTime() - new Date(data.checkin).getTime()) / 86400000
          )
        )
      : 0;

  function syncGuests(count: number) {
    const arr = Array.from(
      { length: count },
      (_, i) => data.guestDetails[i] ?? { title: "mr", first_name: "", last_name: "" }
    );
    updateData({ guests: count, guestDetails: arr });
  }

  async function handleSearch() {
    if (!data.checkin || !data.checkout) {
      setError("يرجى اختيار تاريخ الوصول والمغادرة");
      return;
    }
    if (new Date(data.checkout) <= new Date(data.checkin)) {
      setError("تاريخ المغادرة يجب أن يكون بعد الوصول");
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        ...(data.city && { city: data.city }),
        checkin: data.checkin,
        checkout: data.checkout,
        guests: String(data.guests),
        rooms: String(data.rooms),
        room_type: data.room_type,
        ...(data.min_stars > 0 && { min_stars: String(data.min_stars) }),
        ...(data.max_price && { max_price: data.max_price }),
      });
      const res = await fetch(`/api/v1/hotels/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setHotels(json.data || []);
      next();
    } catch (e: any) {
      setError(e.message || "فشل البحث عن فنادق");
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
          vertical: "hotel",
          data: {
            hotel_id: data.selectedHotel?.id,
            checkin_date: data.checkin,
            checkout_date: data.checkout,
            room_type: data.room_type,
            rooms_count: data.rooms,
            guests: data.guestDetails,
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
    if (currentStep === 1 && !data.selectedHotel) { setError("يرجى اختيار فندق"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null);
    next();
  }

  const totalPrice = data.selectedHotel
    ? Math.round(
        data.selectedHotel.price_per_night *
          (1 + data.selectedHotel.taxes_percent / 100) *
          nights *
          data.rooms
      )
    : 0;

  return (
    <BookingWizardShell
      steps={steps}
      currentStep={currentStep}
      title="Hotel Booking"
      titleAr="حجز فندق"
      locale={locale as "ar" | "en"}
    >
      <WizardError message={error} />

      {/* ── STEP 0: SEARCH ── */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <WizardCard>
            <WizardSectionTitle ar="وجهتك" en="Your Destination" />

            {/* Popular cities */}
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">وجهات شائعة</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => updateData({ city })}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      data.city === city
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-border-light hover:border-brand-green/40 text-text-secondary"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-text-muted mb-1">📍 أو اكتب مدينة أخرى</label>
              <input
                value={data.city}
                onChange={(e) => updateData({ city: e.target.value })}
                placeholder="ادخل اسم المدينة..."
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">📅 تاريخ الوصول</label>
                <input
                  type="date"
                  value={data.checkin}
                  onChange={(e) => updateData({ checkin: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">📅 تاريخ المغادرة</label>
                <input
                  type="date"
                  value={data.checkout}
                  onChange={(e) => updateData({ checkout: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
            </div>

            {data.checkin && data.checkout && nights > 0 && (
              <div className="mb-4 px-3 py-2 bg-brand-green/8 rounded-xl text-sm text-brand-green font-medium text-center">
                🌙 {nights} {nights === 1 ? "ليلة" : "ليالٍ"}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">👤 النزلاء</label>
                <select
                  value={data.guests}
                  onChange={(e) => syncGuests(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">🛏️ الغرف</label>
                <select
                  value={data.rooms}
                  onChange={(e) => updateData({ rooms: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">⭐ النجوم</label>
                <select
                  value={data.min_stars}
                  onChange={(e) => updateData({ min_stars: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  <option value={0}>الكل</option>
                  <option value={3}>3 ★★★</option>
                  <option value={4}>4 ★★★★</option>
                  <option value={5}>5 ★★★★★</option>
                </select>
              </div>
            </div>

            {/* Room type selector */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-muted mb-2">نوع الغرفة</label>
              <div className="grid grid-cols-3 gap-2">
                {(["standard", "deluxe", "suite"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateData({ room_type: type })}
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                      data.room_type === type
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-border-light text-text-secondary hover:border-brand-green/40"
                    }`}
                  >
                    {type === "standard" ? "🛏 عادية" : type === "deluxe" ? "🛏✨ ديلوكس" : "🏨 جناح"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-text-muted mb-1">💰 الحد الأقصى للسعر / ليلة (اختياري)</label>
              <input
                type="number"
                value={data.max_price}
                onChange={(e) => updateData({ max_price: e.target.value })}
                placeholder="بالجنيه المصري"
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>

            <WizardNavButtons
              onBack={back}
              onNext={handleNext}
              isFirst={isFirst}
              isLast={false}
              isSubmitting={searching}
              nextLabel={searching ? "جاري البحث..." : "🔍 بحث عن فنادق"}
            />
          </WizardCard>
        </div>
      )}

      {/* ── STEP 1: SELECT HOTEL ── */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle
            ar={`نتائج البحث (${hotels.length} فندق)`}
            en={`Results (${hotels.length} hotels)`}
          />
          {hotels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏨</div>
              <p className="text-text-muted">لا توجد فنادق متاحة لهذه المعايير</p>
              <button
                onClick={() => back()}
                className="mt-4 px-4 py-2 text-sm text-brand-green font-medium hover:underline"
              >
                تعديل البحث
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {hotels.map((h: any) => (
                <div
                  key={h.id}
                  className={`rounded-xl border-2 transition-all overflow-hidden ${
                    data.selectedHotel?.id === h.id
                      ? "border-brand-green"
                      : "border-border-light hover:border-brand-green/40"
                  }`}
                >
                  {/* Clickable main section */}
                  <div
                    className={`p-4 cursor-pointer ${data.selectedHotel?.id === h.id ? "bg-brand-green/5" : ""}`}
                    onClick={() => updateData({ selectedHotel: h })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-text-primary">{h.name}</p>
                          {data.selectedHotel?.id === h.id && (
                            <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full">محدد ✓</span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted">{h.city}</p>
                        <StarRating stars={h.star_rating} />
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-brand-green">{h.price_per_night?.toLocaleString()} ج.م</p>
                        <p className="text-xs text-text-muted">/ ليلة</p>
                        {nights > 0 && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            إجمالي: {Math.round(h.price_per_night * nights).toLocaleString()} ج.م
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(h.amenities || []).slice(0, 5).map((a: string) => (
                        <AmenityTag key={a} label={a} />
                      ))}
                    </div>
                    {h.cancellation_hours && (
                      <p className="text-xs text-text-muted mt-1.5">
                        🔄 إلغاء مجاني قبل {h.cancellation_hours} ساعة
                      </p>
                    )}
                    {h.board_type && (
                      <p className="text-xs text-brand-green mt-0.5 font-medium">
                        🍽 {BOARD_LABELS[h.board_type] || h.board_type}
                      </p>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <div className="border-t border-border-light">
                    <button
                      onClick={() => setExpandedHotel(expandedHotel === h.id ? null : h.id)}
                      className="w-full text-right px-4 py-2 text-xs text-brand-green font-medium flex items-center justify-between hover:bg-brand-green/5 transition-all"
                    >
                      <span>{expandedHotel === h.id ? "إخفاء التفاصيل" : "عرض التفاصيل"}</span>
                      <span>{expandedHotel === h.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedHotel === h.id && (
                      <div className="px-4 pb-3 text-sm text-text-secondary space-y-1.5">
                        {h.description && <p>{h.description}</p>}
                        {h.address && <p>📍 {h.address}</p>}
                        {h.check_in_time && (
                          <p>🕐 تسجيل الوصول: {h.check_in_time} | المغادرة: {h.check_out_time}</p>
                        )}
                        {h.cancellation_policy && (
                          <p className="text-text-muted text-xs">{h.cancellation_policy}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 2: GUESTS ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.guestDetails.map((g, i) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`النزيل ${i + 1}`} en={`Guest ${i + 1}`} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
                  <select
                    value={g.title}
                    onChange={(e) => {
                      const arr = [...data.guestDetails];
                      arr[i] = { ...arr[i], title: e.target.value };
                      updateData({ guestDetails: arr });
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
                    value={g.first_name}
                    onChange={(e) => {
                      const arr = [...data.guestDetails];
                      arr[i] = { ...arr[i], first_name: e.target.value };
                      updateData({ guestDetails: arr });
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
                  <input
                    value={g.last_name}
                    onChange={(e) => {
                      const arr = [...data.guestDetails];
                      arr[i] = { ...arr[i], last_name: e.target.value };
                      updateData({ guestDetails: arr });
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
                  placeholder="طابق عالٍ، سرير كبير، وصول مبكر..."
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
                />
              </div>
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {currentStep === 3 && data.selectedHotel && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            {/* Hotel summary card */}
            <div className="bg-gradient-to-r from-brand-green/8 to-brand-green/4 rounded-xl p-4 border border-brand-green/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-text-primary text-base">{data.selectedHotel.name}</p>
                  <p className="text-sm text-text-muted">{data.selectedHotel.city}</p>
                  <StarRating stars={data.selectedHotel.star_rating} />
                </div>
                <span className="text-xs bg-white text-brand-green font-medium px-2 py-1 rounded-lg border border-brand-green/20">
                  {ROOM_LABELS[data.room_type]}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-text-muted">وصول</p>
                  <p className="font-bold text-text-primary">{data.checkin}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-text-muted">🌙</p>
                  <p className="font-bold text-brand-green">{nights} ليالٍ</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-text-muted">مغادرة</p>
                  <p className="font-bold text-text-primary">{data.checkout}</p>
                </div>
              </div>
            </div>

            {/* Guests */}
            <div>
              <p className="text-xs font-bold text-text-muted mb-2">النزلاء ({data.guests})</p>
              <div className="space-y-1">
                {data.guestDetails.map((g, i) => (
                  <div key={i} className="flex gap-2 text-sm text-text-secondary py-1 border-b border-border-light last:border-0">
                    <span className="text-text-muted">{i + 1}.</span>
                    <span>{g.first_name} {g.last_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>{data.selectedHotel.price_per_night?.toLocaleString()} ج.م × {nights} ليلة × {data.rooms} غرفة</span>
                <span>{(data.selectedHotel.price_per_night * nights * data.rooms).toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>ضريبة {data.selectedHotel.taxes_percent}%</span>
                <span>
                  {Math.round(data.selectedHotel.price_per_night * nights * data.rooms * data.selectedHotel.taxes_percent / 100).toLocaleString()} ج.م
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border-light">
                <span className="font-bold text-text-primary">الإجمالي</span>
                <span className="text-2xl font-bold text-brand-green">{totalPrice.toLocaleString()} ج.م</span>
              </div>
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
            message="Hotel Booking Confirmed!"
            messageAr="🎉 تم تسجيل حجز الفندق بنجاح!"
            expiresAt={data.booking.expires_at}
            locale={locale as "ar" | "en"}
            onDone={() => router.push(`/${locale}/my-booking`)}
          />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
