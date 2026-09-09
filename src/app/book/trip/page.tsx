"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookingWizardShell, WizardCard, WizardSectionTitle,
  WizardNavButtons, WizardError, WizardSuccess,
} from "@/components/booking/BookingWizardShell";
import { useBookingWizard } from "@/hooks/useBookingWizard";

const STEPS = [
  { id: "browse",    label: "Browse",    labelAr: "تصفح" },
  { id: "select",    label: "Select",    labelAr: "الاختيار" },
  { id: "travelers", label: "Travelers", labelAr: "المسافرون" },
  { id: "review",    label: "Review",    labelAr: "المراجعة" },
  { id: "done",      label: "Done",      labelAr: "تأكيد" },
];

const INITIAL = {
  destination: "", difficulty: "", start_date_from: "", start_date_to: "", max_price: "",
  selectedTrip: null as any,
  travelers: [{ title: "mr", first_name: "", last_name: "", date_of_birth: "", nationality: "EG", emergency_contact_name: "", emergency_contact_phone: "" }],
  contactEmail: "", contactPhone: "", specialRequests: "", dietaryRequirements: "",
  booking: null as any,
};

const difficultyLabels: Record<string, string> = { easy: "سهل", moderate: "متوسط", challenging: "صعب" };

export default function TripBookingPage() {
  const router = useRouter();
  const { currentStep, steps, data, isFirst, isLast, isSubmitting, error,
          next, back, updateData, setIsSubmitting, setError } = useBookingWizard(STEPS, INITIAL);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showItinerary, setShowItinerary] = useState<string | null>(null);

  useEffect(() => { fetchTrips(); }, []);

  async function fetchTrips() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (data.destination) q.set("destination", data.destination);
      if (data.difficulty) q.set("difficulty", data.difficulty);
      if (data.start_date_from) q.set("start_date_from", data.start_date_from);
      if (data.start_date_to) q.set("start_date_to", data.start_date_to);
      if (data.max_price) q.set("max_price", data.max_price);
      const res = await fetch(`/api/v1/trips/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setTrips(json.data || []);
    } catch (e: any) { setError(e.message || "فشل تحميل الرحلات"); }
    finally { setLoading(false); }
  }

  function syncTravelers(count: number) {
    const arr = Array.from({ length: count }, (_, i) =>
      data.travelers[i] ?? { title: "mr", first_name: "", last_name: "", date_of_birth: "", nationality: "EG", emergency_contact_name: "", emergency_contact_phone: "" }
    );
    updateData({ travelers: arr });
  }

  async function handleSubmit() {
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    } catch (e: any) { setError(e.message || "فشل إتمام الحجز"); }
    finally { setIsSubmitting(false); }
  }

  function handleNext() {
    if (currentStep === 0) { fetchTrips(); next(); return; }
    if (currentStep === 1 && !data.selectedTrip) { setError("يرجى اختيار رحلة"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null); next();
  }

  const totalPrice = data.selectedTrip ? data.selectedTrip.price_per_person * data.travelers.length : 0;

  return (
    <BookingWizardShell steps={steps} currentStep={currentStep} title="Trip Booking" titleAr="حجز رحلة سياحية">
      <WizardError message={error} />

      {/* STEP 0: Browse */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <WizardCard>
            <WizardSectionTitle ar="فلترة الرحلات" en="Filter Trips" />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">الوجهة</label>
                <input value={data.destination} onChange={e => updateData({ destination: e.target.value })} placeholder="مرسى علم، سيوة، الأقصر..."
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الصعوبة</label>
                <select value={data.difficulty} onChange={e => updateData({ difficulty: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                  <option value="">الكل</option>
                  <option value="easy">سهل</option>
                  <option value="moderate">متوسط</option>
                  <option value="challenging">صعب</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الحد الأقصى للسعر</label>
                <input type="number" value={data.max_price} onChange={e => updateData({ max_price: e.target.value })} placeholder="بالجنيه المصري"
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">من تاريخ</label>
                <input type="date" value={data.start_date_from} onChange={e => updateData({ start_date_from: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">إلى تاريخ</label>
                <input type="date" value={data.start_date_to} onChange={e => updateData({ start_date_to: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
            </div>
            <button onClick={fetchTrips} disabled={loading}
              className="mt-3 px-4 py-2 rounded-xl bg-brand-green/10 text-brand-green text-sm font-medium hover:bg-brand-green/20 transition-all disabled:opacity-50">
              {loading ? "جاري البحث..." : "تطبيق الفلتر"}
            </button>
          </WizardCard>

          <WizardCard>
            <WizardSectionTitle ar={`الرحلات المتاحة (${trips.length})`} en={`Available Trips (${trips.length})`} />
            {trips.length === 0 ? (
              <p className="text-center text-text-muted py-8">لا توجد رحلات بهذه المعايير</p>
            ) : (
              <div className="space-y-3">
                {trips.map((t: any) => (
                  <div key={t.id}
                    className={`rounded-xl border-2 transition-all ${data.selectedTrip?.id === t.id ? "border-brand-green bg-brand-green/5" : "border-border-light"}`}>
                    <div className="p-4 cursor-pointer" onClick={() => updateData({ selectedTrip: t })}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-text-primary">{t.title_ar}</p>
                          <p className="text-sm text-text-muted">{t.destination} • {t.duration_days} أيام</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full">{difficultyLabels[t.difficulty] || t.difficulty}</span>
                            <span className="text-xs bg-muted text-text-muted px-2 py-0.5 rounded-full">{t.spots_available} مقعد متاح</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-brand-green">{t.price_per_person?.toLocaleString()} ج.م</p>
                          <p className="text-xs text-text-muted">للشخص</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary mt-2">🗓 {t.start_date} — {t.end_date}</p>
                    </div>
                    {/* Itinerary toggle */}
                    <div className="border-t border-border-light">
                      <button onClick={() => setShowItinerary(showItinerary === t.id ? null : t.id)}
                        className="w-full text-right px-4 py-2 text-xs text-brand-green font-medium flex items-center justify-between hover:bg-brand-green/5 transition-all">
                        <span>{showItinerary === t.id ? "إخفاء البرنامج" : "عرض البرنامج التفصيلي"}</span>
                        <span>{showItinerary === t.id ? "▲" : "▼"}</span>
                      </button>
                      {showItinerary === t.id && (
                        <div className="px-4 pb-3 space-y-2">
                          {(t.itinerary || []).map((day: any) => (
                            <div key={day.day} className="text-sm">
                              <span className="font-medium text-brand-green">اليوم {day.day}: </span>
                              <span className="text-text-secondary">{day.title} — {day.description}</span>
                            </div>
                          ))}
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="font-medium text-text-primary mb-1">يشمل:</p>
                              {(t.includes || []).map((item: string, i: number) => <p key={i} className="text-text-secondary">✓ {item}</p>)}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary mb-1">لا يشمل:</p>
                              {(t.excludes || []).map((item: string, i: number) => <p key={i} className="text-text-secondary">✗ {item}</p>)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={() => { if (!data.selectedTrip) { setError("يرجى اختيار رحلة"); return; } setError(null); next(); }} isFirst={isFirst} isLast={false} nextLabel="متابعة" />
        </div>
      )}

      {/* STEP 1 — skipped (merged with browse) */}
      {currentStep === 1 && data.selectedTrip && (
        <WizardCard>
          <WizardSectionTitle ar="تفاصيل الرحلة" en="Trip Details" />
          <div className="bg-brand-green/5 rounded-xl p-4 mb-4">
            <p className="font-bold text-brand-green text-lg">{data.selectedTrip.title_ar}</p>
            <p className="text-sm text-text-secondary mt-1">{data.selectedTrip.destination} • {data.selectedTrip.duration_days} أيام • {difficultyLabels[data.selectedTrip.difficulty]}</p>
            <p className="text-sm text-text-secondary">🗓 {data.selectedTrip.start_date} — {data.selectedTrip.end_date}</p>
            <p className="text-sm text-text-secondary mt-1">📍 نقطة التجمع: {data.selectedTrip.meeting_point} الساعة {data.selectedTrip.meeting_time}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">عدد المسافرين</label>
            <select value={data.travelers.length} onChange={e => syncTravelers(Number(e.target.value))}
              className="w-full h-11 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
              {Array.from({ length: Math.min(10, data.selectedTrip.spots_available) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <p className="text-xs text-text-muted mt-1">{data.selectedTrip.spots_available} مقعد متاح</p>
          </div>
          <div className="flex justify-between items-center border-t pt-3 text-sm">
            <span className="text-text-muted">{data.selectedTrip.price_per_person?.toLocaleString()} ج.م × {data.travelers.length}</span>
            <span className="text-lg font-bold text-brand-green">{(data.selectedTrip.price_per_person * data.travelers.length).toLocaleString()} ج.م</span>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* STEP 2: Travelers */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {data.travelers.map((t: any, i: number) => (
            <WizardCard key={i}>
              <WizardSectionTitle ar={`المسافر ${i + 1}`} en={`Traveler ${i + 1}`} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "اللقب", field: "title", type: "select", opts: [["mr","السيد"],["ms","الآنسة"],["mrs","السيدة"],["dr","د."]] },
                  { label: "الاسم الأول", field: "first_name", type: "text" },
                  { label: "الاسم الأخير", field: "last_name", type: "text" },
                  { label: "تاريخ الميلاد", field: "date_of_birth", type: "date" },
                  { label: "الجنسية (ISO)", field: "nationality", type: "text" },
                ].map(({ label, field, type, opts }) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                    {type === "select" ? (
                      <select value={t[field]} onChange={e => { const arr = [...data.travelers]; arr[i][field] = e.target.value; updateData({ travelers: arr }); }}
                        className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                        {opts?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={t[field]} onChange={e => { const arr = [...data.travelers]; arr[i][field] = e.target.value; updateData({ travelers: arr }); }}
                        className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border-light">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">اسم جهة الطوارئ</label>
                  <input value={t.emergency_contact_name} onChange={e => { const arr = [...data.travelers]; arr[i].emergency_contact_name = e.target.value; updateData({ travelers: arr }); }}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">هاتف الطوارئ</label>
                  <input type="tel" value={t.emergency_contact_phone} onChange={e => { const arr = [...data.travelers]; arr[i].emergency_contact_phone = e.target.value; updateData({ travelers: arr }); }}
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
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">طلبات غذائية</label>
                <input value={data.dietaryRequirements} onChange={e => updateData({ dietaryRequirements: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">طلبات خاصة</label>
                <input value={data.specialRequests} onChange={e => updateData({ specialRequests: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && data.selectedTrip && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الحجز" en="Review Booking" />
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="font-bold text-text-primary">{data.selectedTrip.title_ar}</p>
              <p className="text-sm text-text-secondary">{data.selectedTrip.destination} • {data.selectedTrip.duration_days} أيام</p>
              <p className="text-sm text-text-secondary">🗓 {data.selectedTrip.start_date} — {data.selectedTrip.end_date}</p>
            </div>
            <p className="text-sm font-bold text-text-primary">المسافرون ({data.travelers.length})</p>
            {data.travelers.map((t: any, i: number) => (
              <div key={i} className="text-sm text-text-secondary border-b border-border-light pb-1">{i + 1}. {t.first_name} {t.last_name}</div>
            ))}
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm text-text-muted">{data.selectedTrip.price_per_person?.toLocaleString()} ج.م × {data.travelers.length}</span>
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
          <WizardSuccess reference={data.booking.reference} message="Trip Booking Confirmed!" messageAr="تم تسجيل حجز الرحلة بنجاح!" expiresAt={data.booking.expires_at} onDone={() => router.push("/bookings")} />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
