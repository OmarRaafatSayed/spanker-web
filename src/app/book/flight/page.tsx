"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface FlightData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  class: "economy" | "business" | "first";
  passengers: number;
  tripType: "one-way" | "round-trip";
  selectedFlight: any | null;
  passengerDetails: Array<{
    title: string; first_name: string; last_name: string;
    date_of_birth: string; passport_number: string;
    passport_expiry: string; nationality: string;
  }>;
  contactEmail: string;
  contactPhone: string;
  specialRequests: string;
  booking: any | null;
}

const INITIAL: FlightData = {
  origin: "", destination: "", departureDate: "", returnDate: "",
  class: "economy", passengers: 1, tripType: "one-way",
  selectedFlight: null,
  passengerDetails: [{ title: "mr", first_name: "", last_name: "", date_of_birth: "", passport_number: "", passport_expiry: "", nationality: "EG" }],
  contactEmail: "", contactPhone: "", specialRequests: "", booking: null,
};

export default function FlightBookingPage() {
  const router = useRouter();
  const { currentStep, steps, data, isFirst, isLast, isSubmitting, error,
          next, back, updateData, setIsSubmitting, setError } = useBookingWizard(STEPS, INITIAL);
  const [flights, setFlights] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  /* ── Step 0: Search ── */
  async function handleSearch() {
    if (!data.origin || !data.destination || !data.departureDate) {
      setError("يرجى تعبئة حقول المطار والتاريخ"); return;
    }
    setSearching(true); setError(null);
    try {
      const q = new URLSearchParams({
        origin: data.origin, destination: data.destination,
        departureDate: data.departureDate, class: data.class,
        passengers: String(data.passengers), tripType: data.tripType,
      });
      const res = await fetch(`/api/v1/flights/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setFlights(json.data.outbound || []);
      next();
    } catch (e: any) {
      setError(e.message || "فشل البحث عن رحلات");
    } finally { setSearching(false); }
  }

  /* ── Step 2: Sync passenger count ── */
  function syncPassengers(count: number) {
    const arr = Array.from({ length: count }, (_, i) =>
      data.passengerDetails[i] ?? { title: "mr", first_name: "", last_name: "", date_of_birth: "", passport_number: "", passport_expiry: "", nationality: "EG" }
    );
    updateData({ passengers: count, passengerDetails: arr });
  }

  /* ── Step 4: Submit ── */
  async function handleSubmit() {
    setIsSubmitting(true); setError(null);
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
    } finally { setIsSubmitting(false); }
  }

  function handleNext() {
    if (currentStep === 0) { handleSearch(); return; }
    if (currentStep === 1 && !data.selectedFlight) { setError("يرجى اختيار رحلة"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null); next();
  }

  return (
    <BookingWizardShell steps={steps} currentStep={currentStep} title="Flight Booking" titleAr="حجز رحلة طيران">
      <WizardError message={error} />

      {/* ── STEP 0: Search ── */}
      {currentStep === 0 && (
        <WizardCard>
          <WizardSectionTitle ar="بيانات الرحلة" en="Flight Details" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">من (IATA)</label>
              <input value={data.origin} onChange={e => updateData({ origin: e.target.value.toUpperCase() })}
                placeholder="CAI" maxLength={3}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">إلى (IATA)</label>
              <input value={data.destination} onChange={e => updateData({ destination: e.target.value.toUpperCase() })}
                placeholder="DXB" maxLength={3}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">تاريخ المغادرة</label>
              <input type="date" value={data.departureDate} onChange={e => updateData({ departureDate: e.target.value })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">نوع الرحلة</label>
              <select value={data.tripType} onChange={e => updateData({ tripType: e.target.value as any })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                <option value="one-way">ذهاب فقط</option>
                <option value="round-trip">ذهاب وعودة</option>
              </select>
            </div>
            {data.tripType === "round-trip" && (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">تاريخ العودة</label>
                <input type="date" value={data.returnDate} onChange={e => updateData({ returnDate: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">الدرجة</label>
              <select value={data.class} onChange={e => updateData({ class: e.target.value as any })}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                <option value="economy">اقتصادية</option>
                <option value="business">أعمال</option>
                <option value="first">أولى</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">عدد المسافرين</label>
              <select value={data.passengers} onChange={e => syncPassengers(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} isSubmitting={searching} nextLabel="بحث عن رحلات" />
        </WizardCard>
      )}

      {/* ── STEP 1: Select ── */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle ar={`نتائج البحث (${flights.length} رحلة)`} en={`Search Results (${flights.length} flights)`} />
          {flights.length === 0 ? (
            <p className="text-center text-text-muted py-8">لا توجد رحلات متاحة لهذا الطريق</p>
          ) : (
            <div className="space-y-3">
              {flights.map((f: any) => (
                <div key={f.id} onClick={() => updateData({ selectedFlight: f })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${data.selectedFlight?.id === f.id ? "border-brand-green bg-brand-green/5" : "border-border-light hover:border-brand-green/40"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-primary">{f.airline}</span>
                      <span className="text-text-muted text-sm mr-2">{f.flight_number}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-lg font-bold text-brand-green">{(f.base_price + f.taxes_amount).toLocaleString()} ج.م</span>
                      <span className="block text-xs text-text-muted">للشخص</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
                    <span>{f.origin_iata}</span>
                    <span className="text-brand-green">✈</span>
                    <span>{f.destination_iata}</span>
                    <span className="text-text-muted">•</span>
                    <span>{new Date(f.departure_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="mr-auto bg-muted text-text-muted text-xs px-2 py-0.5 rounded-full">{f.class === "economy" ? "اقتصادية" : f.class === "business" ? "أعمال" : "أولى"}</span>
                  </div>
                  <div className="flex gap-2 mt-1 text-xs text-text-muted">
                    <span>{f.seats_available} مقعد متاح</span>
                    <span>•</span>
                    <span>أمتعة {f.baggage_kg} كجم</span>
                    {f.refundable && <><span>•</span><span className="text-brand-green">قابل للاسترداد</span></>}
                  </div>
                </div>
              ))}
            </div>
          )}
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 2: Passengers ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.passengerDetails.map((p, i) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`الراكب ${i + 1}`} en={`Passenger ${i + 1}`} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
                  <select value={p.title} onChange={e => { const arr = [...data.passengerDetails]; arr[i].title = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                    <option value="mr">السيد</option><option value="ms">الآنسة</option>
                    <option value="mrs">السيدة</option><option value="dr">الدكتور</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأول</label>
                  <input value={p.first_name} onChange={e => { const arr = [...data.passengerDetails]; arr[i].first_name = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
                  <input value={p.last_name} onChange={e => { const arr = [...data.passengerDetails]; arr[i].last_name = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الميلاد</label>
                  <input type="date" value={p.date_of_birth} onChange={e => { const arr = [...data.passengerDetails]; arr[i].date_of_birth = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">رقم الجواز</label>
                  <input value={p.passport_number} onChange={e => { const arr = [...data.passengerDetails]; arr[i].passport_number = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">انتهاء الجواز</label>
                  <input type="date" value={p.passport_expiry} onChange={e => { const arr = [...data.passengerDetails]; arr[i].passport_expiry = e.target.value; updateData({ passengerDetails: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
              </div>
            </WizardCard>
          ))}
          {/* Contact info */}
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
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* ── STEP 3: Review ── */}
      {currentStep === 3 && data.selectedFlight && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="text-sm font-bold text-text-primary mb-1">{data.selectedFlight.airline} {data.selectedFlight.flight_number}</p>
              <p className="text-sm text-text-secondary">{data.selectedFlight.origin_iata} ← {data.selectedFlight.destination_iata}</p>
              <p className="text-sm text-text-secondary">{new Date(data.selectedFlight.departure_at).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary mb-2">الركاب ({data.passengerDetails.length})</p>
              {data.passengerDetails.map((p, i) => (
                <div key={i} className="text-sm text-text-secondary py-1 border-b border-border-light last:border-0">
                  {p.first_name} {p.last_name} — جواز: {p.passport_number}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-text-muted">الإجمالي</span>
              <span className="text-xl font-bold text-brand-green">
                {((data.selectedFlight.base_price + data.selectedFlight.taxes_amount) * data.passengers).toLocaleString()} ج.م
              </span>
            </div>
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 text-sm text-text-secondary">
              <strong>طريقة الدفع:</strong> كاش أو تحويل بنكي — سيتواصل معك فريقنا لتأكيد الدفع
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={true} isSubmitting={isSubmitting} />
        </WizardCard>
      )}

      {/* ── STEP 4: Done ── */}
      {currentStep === 4 && data.booking && (
        <WizardCard>
          <WizardSuccess
            reference={data.booking.reference}
            message="Flight Booking Confirmed!"
            messageAr="تم تسجيل طلب الحجز بنجاح!"
            expiresAt={data.booking.expires_at}
            onDone={() => router.push("/bookings")}
          />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
