"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookingWizardShell, WizardCard, WizardSectionTitle,
  WizardNavButtons, WizardError, WizardSuccess,
} from "@/components/booking/BookingWizardShell";
import { useBookingWizard } from "@/hooks/useBookingWizard";

const STEPS = [
  { id: "search",  label: "Search",  labelAr: "البحث" },
  { id: "select",  label: "Select",  labelAr: "الاختيار" },
  { id: "guests",  label: "Guests",  labelAr: "النزلاء" },
  { id: "review",  label: "Review",  labelAr: "المراجعة" },
  { id: "done",    label: "Done",    labelAr: "تأكيد" },
];

const INITIAL = {
  city: "", checkin: "", checkout: "", guests: 1, rooms: 1,
  room_type: "standard" as "standard" | "deluxe" | "suite",
  min_stars: 0, max_price: "",
  selectedHotel: null as any,
  guestDetails: [{ title: "mr", first_name: "", last_name: "" }],
  contactEmail: "", contactPhone: "", specialRequests: "",
  booking: null as any,
};

export default function HotelBookingPage() {
  const router = useRouter();
  const { currentStep, steps, data, isFirst, isLast, isSubmitting, error,
          next, back, updateData, setIsSubmitting, setError } = useBookingWizard(STEPS, INITIAL);
  const [hotels, setHotels] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const nights = data.checkin && data.checkout
    ? Math.max(1, Math.ceil((new Date(data.checkout).getTime() - new Date(data.checkin).getTime()) / 86400000))
    : 0;

  function syncGuests(count: number) {
    const arr = Array.from({ length: count }, (_, i) =>
      data.guestDetails[i] ?? { title: "mr", first_name: "", last_name: "" }
    );
    updateData({ guests: count, guestDetails: arr });
  }

  async function handleSearch() {
    if (!data.checkin || !data.checkout) { setError("يرجى اختيار تاريخ الوصول والمغادرة"); return; }
    if (new Date(data.checkout) <= new Date(data.checkin)) { setError("تاريخ المغادرة يجب أن يكون بعد الوصول"); return; }
    setSearching(true); setError(null);
    try {
      const q = new URLSearchParams({
        ...(data.city && { city: data.city }),
        checkin: data.checkin, checkout: data.checkout,
        guests: String(data.guests), rooms: String(data.rooms),
        room_type: data.room_type,
        ...(data.min_stars > 0 && { min_stars: String(data.min_stars) }),
        ...(data.max_price && { max_price: data.max_price }),
      });
      const res = await fetch(`/api/v1/hotels/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setHotels(json.data || []);
      next();
    } catch (e: any) { setError(e.message || "فشل البحث"); }
    finally { setSearching(false); }
  }

  async function handleSubmit() {
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "hotel",
          data: {
            hotel_id: data.selectedHotel?.id,
            checkin_date: data.checkin, checkout_date: data.checkout,
            room_type: data.room_type, rooms_count: data.rooms,
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
    } catch (e: any) { setError(e.message || "فشل إتمام الحجز"); }
    finally { setIsSubmitting(false); }
  }

  function handleNext() {
    if (currentStep === 0) { handleSearch(); return; }
    if (currentStep === 1 && !data.selectedHotel) { setError("يرجى اختيار فندق"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null); next();
  }

  const totalPrice = data.selectedHotel
    ? Math.round(data.selectedHotel.price_per_night * (1 + data.selectedHotel.taxes_percent / 100) * nights * data.rooms)
    : 0;

  return (
    <BookingWizardShell steps={steps} currentStep={currentStep} title="Hotel Booking" titleAr="حجز فندق">
      <WizardError message={error} />

      {/* STEP 0: Search */}
      {currentStep === 0 && (
        <WizardCard>
          <WizardSectionTitle ar="بحث عن فندق" en="Search Hotels" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">المدينة</label>
              <input value={data.city} onChange={e => updateData({ city: e.target.value })}
                placeholder="شرم الشيخ، الغردقة، مرسى علم..."
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">تاريخ الوصول</label>
              <input type="date" value={data.checkin} onChange={e => updateData({ checkin: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">تاريخ المغادرة</label>
              <input type="date" value={data.checkout} onChange={e => updateData({ checkout: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">نوع الغرفة</label>
              <select value={data.room_type} onChange={e => updateData({ room_type: e.target.value as any })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                <option value="standard">عادية</option>
                <option value="deluxe">ديلوكس</option>
                <option value="suite">جناح</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">عدد الغرف</label>
              <select value={data.rooms} onChange={e => updateData({ rooms: Number(e.target.value) })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">عدد النزلاء</label>
              <select value={data.guests} onChange={e => syncGuests(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">تصنيف النجوم (الحد الأدنى)</label>
              <select value={data.min_stars} onChange={e => updateData({ min_stars: Number(e.target.value) })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                <option value={0}>الكل</option>
                {[3,4,5].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
              </select>
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} isSubmitting={searching} nextLabel="بحث عن فنادق" />
        </WizardCard>
      )}

      {/* STEP 1: Select */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle ar={`نتائج البحث (${hotels.length} فندق)`} en={`Results (${hotels.length} hotels)`} />
          {hotels.length === 0 ? (
            <p className="text-center text-text-muted py-8">لا توجد فنادق متاحة لهذه المعايير</p>
          ) : (
            <div className="space-y-3">
              {hotels.map((h: any) => (
                <div key={h.id} onClick={() => updateData({ selectedHotel: h })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${data.selectedHotel?.id === h.id ? "border-brand-green bg-brand-green/5" : "border-border-light hover:border-brand-green/40"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-text-primary">{h.name}</p>
                      <p className="text-sm text-text-muted">{h.city} • {"★".repeat(h.star_rating)}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-brand-green">{h.price_per_night?.toLocaleString()} ج.م</p>
                      <p className="text-xs text-text-muted">/ ليلة</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(h.amenities || []).slice(0, 4).map((a: string) => (
                      <span key={a} className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                  <p className="text-xs text-text-muted mt-1">إلغاء مجاني قبل {h.cancellation_hours} ساعة</p>
                </div>
              ))}
            </div>
          )}
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* STEP 2: Guests */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.guestDetails.map((g: any, i: number) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`النزيل ${i + 1}`} en={`Guest ${i + 1}`} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
                  <select value={g.title} onChange={e => { const arr = [...data.guestDetails]; arr[i].title = e.target.value; updateData({ guestDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                    <option value="mr">السيد</option><option value="ms">الآنسة</option>
                    <option value="mrs">السيدة</option><option value="dr">د.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأول</label>
                  <input value={g.first_name} onChange={e => { const arr = [...data.guestDetails]; arr[i].first_name = e.target.value; updateData({ guestDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
                  <input value={g.last_name} onChange={e => { const arr = [...data.guestDetails]; arr[i].last_name = e.target.value; updateData({ guestDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
              </div>
            </WizardCard>
          ))}
          <WizardCard>
            <WizardSectionTitle ar="بيانات التواصل" en="Contact Details" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">البريد الإلكتروني</label>
                <input type="email" value={data.contactEmail} onChange={e => updateData({ contactEmail: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">رقم الهاتف</label>
                <input type="tel" value={data.contactPhone} onChange={e => updateData({ contactPhone: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">طلبات خاصة (اختياري)</label>
                <textarea rows={2} value={data.specialRequests} onChange={e => updateData({ specialRequests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none" />
              </div>
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && data.selectedHotel && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="font-bold text-text-primary">{data.selectedHotel.name}</p>
              <p className="text-sm text-text-secondary">{data.selectedHotel.city} • {"★".repeat(data.selectedHotel.star_rating)}</p>
              <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                <span>📅 {data.checkin} → {data.checkout}</span>
                <span>🌙 {nights} ليلة</span>
              </div>
              <p className="text-sm text-text-secondary mt-1">
                {data.rooms} غرفة {data.room_type === "standard" ? "عادية" : data.room_type === "deluxe" ? "ديلوكس" : "جناح"} • {data.guests} نزيل
              </p>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <div className="text-sm text-text-muted">
                <p>{data.selectedHotel.price_per_night?.toLocaleString()} ج.م × {nights} ليلة × {data.rooms} غرفة</p>
                <p>+ ضريبة {data.selectedHotel.taxes_percent}%</p>
              </div>
              <span className="text-xl font-bold text-brand-green">{totalPrice.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 text-sm text-text-secondary">
              <strong>طريقة الدفع:</strong> كاش أو تحويل بنكي — سيتواصل معك فريقنا
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={true} isSubmitting={isSubmitting} />
        </WizardCard>
      )}

      {/* STEP 4: Done */}
      {currentStep === 4 && data.booking && (
        <WizardCard>
          <WizardSuccess reference={data.booking.reference} message="Hotel Booking Confirmed!" messageAr="تم تسجيل حجز الفندق بنجاح!" expiresAt={data.booking.expires_at} onDone={() => router.push("/bookings")} />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
