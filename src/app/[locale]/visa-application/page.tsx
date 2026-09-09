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
  { id: "program",   label: "Program",   labelAr: "البرنامج" },
  { id: "applicant", label: "Applicant", labelAr: "المتقدم" },
  { id: "contact",   label: "Contact",   labelAr: "التواصل" },
  { id: "review",    label: "Review",    labelAr: "المراجعة" },
  { id: "done",      label: "Done",      labelAr: "تأكيد" },
];

interface Applicant {
  title: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number: string;
  passport_issue_date: string;
  passport_expiry: string;
  nationality: string;
  occupation: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface TravelDates {
  intended_arrival: string;
  intended_departure: string;
}

interface VisaData {
  destination: string;
  visa_type: string;
  nationality: string;
  selectedVisa: any | null;
  applicant: Applicant;
  contact: ContactInfo;
  travel_dates: TravelDates;
  purpose_of_visit: string;
  booking: any | null;
}

const INITIAL: VisaData = {
  destination: "",
  visa_type: "",
  nationality: "EG",
  selectedVisa: null,
  applicant: {
    title: "mr",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    passport_number: "",
    passport_issue_date: "",
    passport_expiry: "",
    nationality: "EG",
    occupation: "",
  },
  contact: {
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Egypt",
  },
  travel_dates: {
    intended_arrival: "",
    intended_departure: "",
  },
  purpose_of_visit: "",
  booking: null,
};

const VISA_TYPE_META: Record<string, { label: string; icon: string; desc: string }> = {
  tourist:  { label: "سياحية",  icon: "🏖️", desc: "للزيارة والسياحة" },
  business: { label: "أعمال",   icon: "💼", desc: "للمؤتمرات والاجتماعات" },
  student:  { label: "طالب",    icon: "🎓", desc: "للدراسة والبحث العلمي" },
  work:     { label: "عمل",     icon: "🔧", desc: "للعمل والتوظيف" },
  transit:  { label: "عبور",    icon: "✈️", desc: "للعبور والترانزيت" },
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  vip:         { label: "VIP",        color: "bg-amber-100 text-amber-700" },
  standard:    { label: "عادية",      color: "bg-blue-100 text-blue-700" },
  urgent:      { label: "عاجلة",      color: "bg-red-100 text-red-700" },
  multi_entry: { label: "متعدد الدخول", color: "bg-purple-100 text-purple-700" },
  extension:   { label: "تمديد",      color: "bg-green-100 text-green-700" },
};

const POPULAR_DESTINATIONS = [
  { code: "AE", name: "الإمارات", flag: "🇦🇪" },
  { code: "SA", name: "السعودية", flag: "🇸🇦" },
  { code: "TR", name: "تركيا",    flag: "🇹🇷" },
  { code: "DE", name: "ألمانيا",  flag: "🇩🇪" },
  { code: "FR", name: "فرنسا",    flag: "🇫🇷" },
  { code: "GB", name: "بريطانيا", flag: "🇬🇧" },
  { code: "US", name: "أمريكا",   flag: "🇺🇸" },
  { code: "HU", name: "المجر",    flag: "🇭🇺" },
];

const PROCESSING_SPEED: Record<number, { label: string; color: string }> = {
  1:  { label: "يوم واحد",  color: "text-red-600" },
  2:  { label: "يومان",    color: "text-orange-600" },
  3:  { label: "٣ أيام",   color: "text-yellow-600" },
  5:  { label: "٥ أيام",   color: "text-brand-green" },
  7:  { label: "أسبوع",    color: "text-brand-green" },
  10: { label: "١٠ أيام",  color: "text-text-muted" },
  14: { label: "أسبوعان",  color: "text-text-muted" },
};

function processingLabel(days: number) {
  const entry = PROCESSING_SPEED[days];
  if (entry) return entry;
  if (days <= 3)  return { label: `${days} أيام`,  color: "text-orange-600" };
  if (days <= 7)  return { label: `${days} أيام`,  color: "text-brand-green" };
  return           { label: `${days} يوم`,          color: "text-text-muted" };
}

export default function VisaApplicationPage() {
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
  } = useBookingWizard<VisaData>(STEPS, INITIAL);

  const [visas, setVisas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVisa, setExpandedVisa] = useState<string | null>(null);

  useEffect(() => {
    fetchVisas();
  }, []);

  async function fetchVisas(filters?: { destination?: string; visa_type?: string; nationality?: string }) {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters?.destination) q.set("destination", filters.destination);
      if (filters?.visa_type)   q.set("visa_type",   filters.visa_type);
      if (filters?.nationality) q.set("nationality", filters.nationality);
      const res  = await fetch(`/api/v1/visas/search?${q}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message);
      setVisas(json.data || []);
    } catch (e: any) {
      setError(e.message || "فشل تحميل برامج التأشيرات");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res  = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (e: any) {
      setError(e.message || "فشل إتمام الطلب");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (currentStep === 0 && !data.selectedVisa) { setError("يرجى اختيار برنامج تأشيرة"); return; }
    if (currentStep === 3) { handleSubmit(); return; }
    setError(null);
    next();
  }

  return (
    <BookingWizardShell
      steps={steps}
      currentStep={currentStep}
      title="Visa Application"
      titleAr="طلب تأشيرة"
      locale={locale as "ar" | "en"}
    >
      <WizardError message={error} />

      {/* ── STEP 0: CHOOSE PROGRAM ── */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* Filter card */}
          <WizardCard>
            <WizardSectionTitle ar="اختر وجهتك" en="Choose Destination" />

            {/* Popular destinations */}
            <div className="mb-4">
              <p className="text-xs text-text-muted mb-2">وجهات شائعة</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_DESTINATIONS.map(({ code, name, flag }) => (
                  <button
                    key={code}
                    onClick={() => updateData({ destination: name })}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                      data.destination === name
                        ? "border-brand-green bg-brand-green/10 text-brand-green"
                        : "border-border-light hover:border-brand-green/40 text-text-secondary"
                    }`}
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-xs font-medium text-text-muted mb-1">الوجهة</label>
                <input
                  value={data.destination}
                  onChange={(e) => updateData({ destination: e.target.value })}
                  placeholder="أو اكتب الدولة..."
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">نوع التأشيرة</label>
                <select
                  value={data.visa_type}
                  onChange={(e) => updateData({ visa_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                >
                  <option value="">الكل</option>
                  {Object.entries(VISA_TYPE_META).map(([v, { label, icon }]) => (
                    <option key={v} value={v}>{icon} {label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">الجنسية (ISO)</label>
                <input
                  value={data.nationality}
                  onChange={(e) => updateData({ nationality: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="EG"
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
            </div>

            <button
              onClick={() => fetchVisas({ destination: data.destination, visa_type: data.visa_type, nationality: data.nationality })}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-brand-green/10 text-brand-green text-sm font-bold hover:bg-brand-green/20 transition-all disabled:opacity-50"
            >
              {loading ? "🔄 جاري البحث..." : "🔍 بحث عن برامج التأشيرات"}
            </button>
          </WizardCard>

          {/* Results card */}
          <WizardCard>
            <WizardSectionTitle
              ar={`البرامج المتاحة (${visas.length})`}
              en={`Available Programs (${visas.length})`}
            />

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border-light p-4">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : visas.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-2">🛂</div>
                <p className="text-text-muted text-sm">لا توجد برامج. غيّر معايير البحث.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visas.map((v: any) => {
                  const typeMeta = VISA_TYPE_META[v.visa_type] ?? { label: v.visa_type, icon: "📄", desc: "" };
                  const catMeta  = CATEGORY_META[v.category]  ?? { label: v.category, color: "bg-muted text-text-muted" };
                  const proc     = processingLabel(v.processing_days);
                  const selected = data.selectedVisa?.id === v.id;

                  return (
                    <div
                      key={v.id}
                      className={`rounded-xl border-2 overflow-hidden transition-all ${
                        selected
                          ? "border-brand-green"
                          : "border-border-light hover:border-brand-green/40"
                      }`}
                    >
                      <div
                        className={`p-4 cursor-pointer ${selected ? "bg-brand-green/5" : ""}`}
                        onClick={() => updateData({ selectedVisa: v })}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg">{typeMeta.icon}</span>
                              <span className="font-bold text-text-primary">{v.destination_country}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catMeta.color}`}>
                                {catMeta.label}
                              </span>
                              {selected && (
                                <span className="text-xs bg-brand-green text-white px-2 py-0.5 rounded-full">محدد ✓</span>
                              )}
                            </div>
                            <p className="text-sm text-text-secondary">
                              {typeMeta.label} • صلاحية {v.validity_months} شهر • إقامة {v.max_stay_days} يوم
                            </p>
                          </div>
                          <div className="text-left mr-2">
                            <p className="text-lg font-bold text-brand-green">
                              {(v.price + v.service_fee)?.toLocaleString()} ج.م
                            </p>
                            <p className="text-xs text-text-muted">شامل الخدمة</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={`font-medium ${proc.color}`}>
                            ⏱ {proc.label}
                          </span>
                          {v.is_urgent_available && (
                            <span className="text-orange-600">
                              ⚡ عاجلة: {v.urgent_price?.toLocaleString()} ج.م
                            </span>
                          )}
                          {v.child_price && (
                            <span className="text-text-muted">
                              👶 أطفال: {v.child_price?.toLocaleString()} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <div className="border-t border-border-light">
                        <button
                          onClick={() => setExpandedVisa(expandedVisa === v.id ? null : v.id)}
                          className="w-full text-right px-4 py-2 text-xs text-brand-green font-medium flex items-center justify-between hover:bg-brand-green/5 transition-all"
                        >
                          <span>{expandedVisa === v.id ? "إخفاء المتطلبات" : "عرض المتطلبات والتفاصيل"}</span>
                          <span>{expandedVisa === v.id ? "▲" : "▼"}</span>
                        </button>
                        {expandedVisa === v.id && (
                          <div className="px-4 pb-3 space-y-2 text-sm text-text-secondary">
                            {v.required_documents?.length > 0 && (
                              <div>
                                <p className="font-medium text-text-primary text-xs mb-1">المستندات المطلوبة:</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {v.required_documents.map((doc: string, i: number) => (
                                    <div key={i} className="flex items-center gap-1 text-xs">
                                      <span className="text-brand-green">✓</span>
                                      <span>{doc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {v.notes && (
                              <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg p-2 text-xs text-text-secondary">
                                📝 {v.notes}
                              </div>
                            )}
                            {v.deposit_amount > 0 && (
                              <p className="text-xs text-text-muted">
                                💰 عربون: {v.deposit_amount?.toLocaleString()} ج.م
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </WizardCard>

          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </div>
      )}

      {/* ── STEP 1: APPLICANT DETAILS ── */}
      {currentStep === 1 && (
        <WizardCard>
          <WizardSectionTitle ar="بيانات المتقدم" en="Applicant Details" />

          {/* Selected visa mini-summary */}
          {data.selectedVisa && (
            <div className="mb-4 flex items-center gap-3 bg-brand-green/8 rounded-xl p-3 border border-brand-green/20">
              <span className="text-2xl">{VISA_TYPE_META[data.selectedVisa.visa_type]?.icon ?? "🛂"}</span>
              <div>
                <p className="font-bold text-brand-green text-sm">{data.selectedVisa.destination_country}</p>
                <p className="text-xs text-text-muted">
                  {VISA_TYPE_META[data.selectedVisa.visa_type]?.label} • {data.selectedVisa.processing_days} أيام عمل
                </p>
              </div>
              <span className="mr-auto font-bold text-brand-green text-sm">
                {(data.selectedVisa.price + data.selectedVisa.service_fee)?.toLocaleString()} ج.م
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">اللقب</label>
              <select
                value={data.applicant.title}
                onChange={(e) => updateData({ applicant: { ...data.applicant, title: e.target.value } })}
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
                value={data.applicant.first_name}
                onChange={(e) => updateData({ applicant: { ...data.applicant, first_name: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">الاسم الأخير</label>
              <input
                value={data.applicant.last_name}
                onChange={(e) => updateData({ applicant: { ...data.applicant, last_name: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الميلاد</label>
              <input
                type="date"
                value={data.applicant.date_of_birth}
                onChange={(e) => updateData({ applicant: { ...data.applicant, date_of_birth: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">رقم الجواز</label>
              <input
                value={data.applicant.passport_number}
                onChange={(e) => updateData({ applicant: { ...data.applicant, passport_number: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">تاريخ إصدار الجواز</label>
              <input
                type="date"
                value={data.applicant.passport_issue_date}
                onChange={(e) => updateData({ applicant: { ...data.applicant, passport_issue_date: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">تاريخ انتهاء الجواز</label>
              <input
                type="date"
                value={data.applicant.passport_expiry}
                onChange={(e) => updateData({ applicant: { ...data.applicant, passport_expiry: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">الجنسية (ISO)</label>
              <input
                value={data.applicant.nationality}
                onChange={(e) => updateData({ applicant: { ...data.applicant, nationality: e.target.value.toUpperCase() } })}
                maxLength={2}
                placeholder="EG"
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">المهنة (اختياري)</label>
              <input
                value={data.applicant.occupation}
                onChange={(e) => updateData({ applicant: { ...data.applicant, occupation: e.target.value } })}
                placeholder="مهندس، طبيب، مدرس..."
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
          </div>

          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 2: CONTACT & TRAVEL DATES ── */}
      {currentStep === 2 && (
        <WizardCard>
          <WizardSectionTitle ar="بيانات التواصل والسفر" en="Contact & Travel Details" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={data.contact.email}
                onChange={(e) => updateData({ contact: { ...data.contact, email: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={data.contact.phone}
                onChange={(e) => updateData({ contact: { ...data.contact, phone: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-text-muted mb-1">العنوان</label>
              <input
                value={data.contact.address}
                onChange={(e) => updateData({ contact: { ...data.contact, address: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">المدينة</label>
              <input
                value={data.contact.city}
                onChange={(e) => updateData({ contact: { ...data.contact, city: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">الدولة</label>
              <input
                value={data.contact.country}
                onChange={(e) => updateData({ contact: { ...data.contact, country: e.target.value } })}
                className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border-light">
            <p className="text-xs font-bold text-text-muted mb-3">🗓 تواريخ السفر المقترحة (اختياري)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">تاريخ الوصول</label>
                <input
                  type="date"
                  value={data.travel_dates.intended_arrival}
                  onChange={(e) => updateData({ travel_dates: { ...data.travel_dates, intended_arrival: e.target.value } })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">تاريخ المغادرة</label>
                <input
                  type="date"
                  value={data.travel_dates.intended_departure}
                  onChange={(e) => updateData({ travel_dates: { ...data.travel_dates, intended_departure: e.target.value } })}
                  className="w-full h-10 px-3 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-text-muted mb-1">الغرض من الزيارة (اختياري)</label>
            <textarea
              rows={2}
              value={data.purpose_of_visit}
              onChange={(e) => updateData({ purpose_of_visit: e.target.value })}
              placeholder="سياحة، زيارة عائلة، مؤتمر أعمال..."
              className="w-full px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green resize-none"
            />
          </div>

          <WizardNavButtons onBack={back} onNext={handleNext} isFirst={isFirst} isLast={false} />
        </WizardCard>
      )}

      {/* ── STEP 3: REVIEW ── */}
      {currentStep === 3 && data.selectedVisa && (
        <WizardCard>
          <WizardSectionTitle ar="مراجعة الطلب" en="Review Application" />
          <div className="space-y-4">
            {/* Visa summary */}
            <div className="bg-gradient-to-r from-brand-green/8 to-brand-green/4 rounded-xl p-4 border border-brand-green/20">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{VISA_TYPE_META[data.selectedVisa.visa_type]?.icon ?? "🛂"}</span>
                <div>
                  <p className="font-bold text-text-primary">{data.selectedVisa.destination_country}</p>
                  <p className="text-sm text-text-secondary">
                    {VISA_TYPE_META[data.selectedVisa.visa_type]?.label} •{" "}
                    صلاحية {data.selectedVisa.validity_months} شهر •{" "}
                    إقامة {data.selectedVisa.max_stay_days} يوم
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                <span>⏱ {data.selectedVisa.processing_days} أيام عمل</span>
                {data.selectedVisa.is_urgent_available && (
                  <span className="text-orange-600">⚡ متوفرة بصورة عاجلة</span>
                )}
              </div>
            </div>

            {/* Applicant summary */}
            <div className="bg-muted rounded-xl p-3 space-y-1 text-sm text-text-secondary">
              <p className="font-bold text-text-primary text-xs mb-2">بيانات المتقدم</p>
              <p>
                <span className="text-text-muted">الاسم:</span>{" "}
                {data.applicant.first_name} {data.applicant.last_name}
              </p>
              <p>
                <span className="text-text-muted">الجواز:</span>{" "}
                {data.applicant.passport_number}
                {data.applicant.passport_expiry && ` — ينتهي ${data.applicant.passport_expiry}`}
              </p>
              <p>
                <span className="text-text-muted">الجنسية:</span>{" "}
                {data.applicant.nationality}
              </p>
              {data.contact.email && (
                <p>
                  <span className="text-text-muted">البريد:</span>{" "}
                  {data.contact.email}
                </p>
              )}
            </div>

            {/* Travel dates */}
            {data.travel_dates.intended_arrival && (
              <div className="flex gap-4 text-sm text-text-secondary bg-muted rounded-xl p-3">
                <span>📅 وصول: {data.travel_dates.intended_arrival}</span>
                {data.travel_dates.intended_departure && (
                  <span>📅 مغادرة: {data.travel_dates.intended_departure}</span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm text-text-secondary mb-1">
                <span>رسوم التأشيرة</span>
                <span>{data.selectedVisa.price?.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary mb-2">
                <span>رسوم الخدمة</span>
                <span>{data.selectedVisa.service_fee?.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-bold text-text-primary">الإجمالي</span>
                <span className="text-2xl font-bold text-brand-green">
                  {(data.selectedVisa.price + data.selectedVisa.service_fee)?.toLocaleString()} ج.م
                </span>
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
            submitLabel="📤 تقديم الطلب"
          />
        </WizardCard>
      )}

      {/* ── STEP 4: DONE ── */}
      {currentStep === 4 && data.booking && (
        <WizardCard>
          <WizardSuccess
            reference={data.booking.reference}
            message="Visa Application Submitted!"
            messageAr="🎉 تم تقديم طلب التأشيرة بنجاح!"
            expiresAt={data.booking.expires_at}
            locale={locale as "ar" | "en"}
            onDone={() => router.push(`/${locale}/my-booking`)}
          />
        </WizardCard>
      )}
    </BookingWizardShell>
  );
}
