"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookingWizardShell, WizardCard, WizardSectionTitle,
  WizardNavButtons, WizardError, WizardSuccess,
} from "@/components/booking/BookingWizardShell";
import { useBookingWizard } from "@/hooks/useBookingWizard";

const STEPS = [
  { id: "program",   label: "Program",    labelAr: "البرنامج" },
  { id: "applicant", label: "Applicant",  labelAr: "المتقدم" },
  { id: "contact",   label: "Contact",    labelAr: "التواصل" },
  { id: "review",    label: "Review",     labelAr: "المراجعة" },
  { id: "done",      label: "Done",       labelAr: "تأكيد" },
];

const INITIAL = {
  destination: "", visa_type: "", nationality: "EG",
  selectedVisa: null as any,
  applicant: { title: "mr", first_name: "", last_name: "", date_of_birth: "", passport_number: "", passport_expiry: "", passport_issue_date: "", nationality: "EG", occupation: "" },
  contact: { email: "", phone: "", address: "", city: "", country: "Egypt" },
  travel_dates: { intended_arrival: "", intended_departure: "" },
  purpose_of_visit: "",
  booking: null as any,
};

export default function VisaBookingPage() {
  const router = useRouter();
  const { currentStep, steps, data, isFirst, isLast, isSubmitting, error,
          next, back, updateData, setIsSubmitting, setError } = useBookingWizard(STEPS, INITIAL);
  const [visas, setVisas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-load visas on mount
  useEffect(() => {
    fetchVisas();
  }, []);

  async function fetchVisas(filters?: { destination?: string; visa_type?: string; nationality?: string }) {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters?.destination) q.set("destination", filters.destination);
      if (filters?.visa_type) q.set("visa_type", filters.visa_type);
      if (filters?.nationality) q.set("nationality", filters.nationality);
      const res = await fetch(`/api/v1/visas/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setVisas(json.data || []);
    } catch (e: any) { setError(e.message || "فشل تحميل برامج التأشيرات"); }
    finally { setLoading(false); }
  }

  async function handleSubmit() {
    setIsSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical: "visa",
          data: {
            visa_id: data.selectedVisa?.id,
            applicant: { ...data.applicant, nationality: data.applicant.nationality || data.nationality },
            contact: data.contact,
            travel_dates: data.travel_dates.intended_arrival ? data.travel_dates : undefined,
            purpose_of_visit: data.purpose_of_visit || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      updateData({ booking: json.data });
      next();
    } catch (e: any) { setError(e.message || "فشل إتمام الطلب"); }
    finally { setIsSubmitting(false); }
  }

  function handleNext() {
    if (currentStep === 0 && !data.selectedVisa) { setError("يرجى اختيار برنامج تأشيرة"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null); next();
  }

  const typeLabels: Record<string, string> = { tourist: "سياحية", business: "أعمال", student: "طالب", work: "عمل", transit: "عبور" };

  return (
    <BookingWizardShell steps={steps} currentStep={currentStep} title="Visa Application" titleAr="طلب تأشيرة">
      <WizardError message={error} />

      {/* STEP 0: Program select */}
      {currentStep === 0 && (
        <div className="space-y-4">
          <WizardCard>
            <WizardSectionTitle ar="فلترة البرامج" en="Filter Programs" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الوجهة</label>
                <input value={data.destination} onChange={e => updateData({ destination: e.target.value })} placeholder="الإمارات، السعودية..."
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">نوع التأشيرة</label>
                <select value={data.visa_type} onChange={e => updateData({ visa_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                  <option value="">الكل</option>
                  <option value="tourist">سياحية</option>
                  <option value="business">أعمال</option>
                  <option value="student">طالب</option>
                  <option value="work">عمل</option>
                  <option value="transit">عبور</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الجنسية</label>
                <input value={data.nationality} onChange={e => updateData({ nationality: e.target.value.toUpperCase() })} maxLength={2} placeholder="EG"
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
              </div>
            </div>
            <button onClick={() => fetchVisas({ destination: data.destination, visa_type: data.visa_type, nationality: data.nationality })}
              disabled={loading}
              className="mt-3 px-4 py-2 rounded-xl bg-brand-green/10 text-brand-green text-sm font-medium hover:bg-brand-green/20 transition-all disabled:opacity-50">
              {loading ? "جاري البحث..." : "تطبيق الفلتر"}
            </button>
          </WizardCard>
          <WizardCard>
            <WizardSectionTitle ar={`برامج التأشيرات (${visas.length})`} en={`Visa Programs (${visas.length})`} />
            <div className="space-y-3">
              {visas.map((v: any) => (
                <div key={v.id} onClick={() => updateData({ selectedVisa: v })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${data.selectedVisa?.id === v.id ? "border-brand-green bg-brand-green/5" : "border-border-light hover:border-brand-green/40"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-text-primary">{v.destination_country}</p>
                      <p className="text-sm text-text-muted">{typeLabels[v.visa_type] || v.visa_type} • {v.validity_months} شهر • إقامة {v.max_stay_days} يوم</p>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-brand-green">{(v.price + v.service_fee)?.toLocaleString()} ج.م</p>
                      <p className="text-xs text-text-muted">شامل الخدمة</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-1">⏱ {v.processing_days} أيام عمل</p>
                  <div className="mt-1 text-xs text-text-muted">
                    <strong>المطلوب:</strong> {v.required_documents?.join("، ")}
                  </div>
                </div>
              ))}
            </div>
          </WizardCard>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* STEP 1: Applicant */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle ar="بيانات المتقدم" en="Applicant Details" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "اللقب", field: "title", type: "select", opts: [["mr","السيد"],["ms","الآنسة"],["mrs","السيدة"],["dr","الدكتور"]] },
              { label: "الاسم الأول", field: "first_name", type: "text" },
              { label: "الاسم الأخير", field: "last_name", type: "text" },
              { label: "تاريخ الميلاد", field: "date_of_birth", type: "date" },
              { label: "رقم الجواز", field: "passport_number", type: "text" },
              { label: "إصدار الجواز", field: "passport_issue_date", type: "date" },
              { label: "انتهاء الجواز", field: "passport_expiry", type: "date" },
              { label: "الجنسية (ISO)", field: "nationality", type: "text" },
              { label: "المهنة (اختياري)", field: "occupation", type: "text" },
            ].map(({ label, field, type, opts }) => (
              <div key={field} className={field === "occupation" ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-text-muted mb-1">{label}</label>
                {type === "select" ? (
                  <select value={(data.applicant as any)[field]} onChange={e => updateData({ applicant: { ...data.applicant, [field]: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green">
                    {opts?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <input type={type} value={(data.applicant as any)[field]} onChange={e => updateData({ applicant: { ...data.applicant, [field]: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
                )}
              </div>
            ))}
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* STEP 2: Contact */}
      {currentStep === 2 && (
        <WizardCard>
          <WizardSectionTitle ar="بيانات التواصل والسفر" en="Contact & Travel Details" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">البريد الإلكتروني</label>
              <input type="email" value={data.contact.email} onChange={e => updateData({ contact: { ...data.contact, email: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">رقم الهاتف</label>
              <input type="tel" value={data.contact.phone} onChange={e => updateData({ contact: { ...data.contact, phone: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">العنوان</label>
              <input value={data.contact.address} onChange={e => updateData({ contact: { ...data.contact, address: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">المدينة</label>
              <input value={data.contact.city} onChange={e => updateData({ contact: { ...data.contact, city: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">الدولة</label>
              <input value={data.contact.country} onChange={e => updateData({ contact: { ...data.contact, country: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الوصول المقترح</label>
              <input type="date" value={data.travel_dates.intended_arrival} onChange={e => updateData({ travel_dates: { ...data.travel_dates, intended_arrival: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">تاريخ المغادرة المقترح</label>
              <input type="date" value={data.travel_dates.intended_departure} onChange={e => updateData({ travel_dates: { ...data.travel_dates, intended_departure: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">الغرض من الزيارة</label>
              <textarea rows={2} value={data.purpose_of_visit} onChange={e => updateData({ purpose_of_visit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none" />
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* STEP 3: Review */}
      {currentStep === 3 && data.selectedVisa && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الطلب" en="Review Application" />
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4">
              <p className="font-bold text-text-primary">{data.selectedVisa.destination_country} — {typeLabels[data.selectedVisa.visa_type]}</p>
              <p className="text-sm text-text-secondary">صلاحية {data.selectedVisa.validity_months} شهر • إقامة {data.selectedVisa.max_stay_days} يوم</p>
              <p className="text-sm text-text-secondary">⏱ {data.selectedVisa.processing_days} أيام عمل</p>
            </div>
            <div className="text-sm space-y-1 text-text-secondary">
              <p><strong>المتقدم:</strong> {data.applicant.first_name} {data.applicant.last_name}</p>
              <p><strong>الجواز:</strong> {data.applicant.passport_number} — ينتهي {data.applicant.passport_expiry}</p>
              <p><strong>الجنسية:</strong> {data.applicant.nationality}</p>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm text-text-muted">الإجمالي</span>
              <span className="text-xl font-bold text-brand-green">{(data.selectedVisa.price + data.selectedVisa.service_fee)?.toLocaleString()} ج.م</span>
            </div>
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-3 text-sm text-text-secondary">
              <strong>طريقة الدفع:</strong> كاش أو تحويل بنكي — سيتواصل معك فريقنا
            </div>
          </div>
          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={true} isSubmitting={isSubmitting} submitLabel="تقديم الطلب" />
        </WizardCard>
      )}

      {/* STEP 4: Done */}
      {currentStep === 4 && data.booking && (
        <WizardCard>
          <WizardSuccess reference={data.booking.reference} message="Application Submitted!" messageAr="تم تقديم طلب التأشيرة بنجاح!" expiresAt={data.booking.expires_at} onDone={() => router.push("/bookings")} />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
