"use client";

/**
 * /dashboard/travel/new — New Travel Request form
 *
 * REFACTORED (Task 2):
 *   - Replaced mock setTimeout submission with real travelRequestsService.create()
 *   - Validation errors shown inline, never blocking
 *   - Server errors shown in form without crashing the page
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { travelRequestsService } from "@/lib/services/travel-requests-service";
import type { TravelType } from "@/types";

// =============================================================================
// Validation schema
// =============================================================================

const schema = z.object({
  destination_country: z.string().min(1, "اختر الوجهة"),
  travel_type: z.enum(["visa_only", "visa_flight", "visa_hotel", "full_package"]),
  traveler_count: z.number().min(1).max(20),
  departure_date: z.string().optional(),
  return_date:    z.string().optional(),
  customer_notes: z.string().optional(),
});

type RequestForm = z.infer<typeof schema>;

// =============================================================================
// Static data
// =============================================================================

const DESTINATIONS = [
  "الإمارات", "تركيا", "المجر", "الأردن", "السعودية", "عُمان",
  "قطر", "الكويت", "البحرين", "بريطانيا", "ألمانيا", "فرنسا",
  "إيطاليا", "إسبانيا", "اليونان", "النمسا", "بولندا", "التشيك",
];

const TRAVEL_TYPES: { value: TravelType; labelAr: string; labelEn: string; icon: string }[] = [
  { value: "visa_only",    labelAr: "فيزا فقط",     labelEn: "Visa Only",    icon: "🛂" },
  { value: "visa_flight",  labelAr: "فيزا + طيران", labelEn: "Visa + Flight",icon: "✈️" },
  { value: "visa_hotel",   labelAr: "فيزا + فندق",  labelEn: "Visa + Hotel", icon: "🏨" },
  { value: "full_package", labelAr: "باقة كاملة",   labelEn: "Full Package", icon: "📦" },
];

// =============================================================================
// Page
// =============================================================================

export default function NewTravelRequestPage() {
  const router = useRouter();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted,   setSubmitted]   = useState<{ id: string } | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestForm>({
    resolver: zodResolver(schema),
    defaultValues: { traveler_count: 1, travel_type: "visa_only" },
  });

  const selectedType = watch("travel_type");

  async function onSubmit(data: RequestForm) {
    setServerError(null);
    setSubmitting(true);

    const result = await travelRequestsService.create({
      destination_country: data.destination_country,
      travel_type:         data.travel_type,
      traveler_count:      data.traveler_count,
      departure_date:      data.departure_date,
      return_date:         data.return_date,
      customer_notes:      data.customer_notes,
    });

    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.error);
      return;
    }

    setSubmitted({ id: result.data.id });
  }

  const inputCls = "w-full h-11 px-3 border border-border-light rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    const trackingCode = submitted.id.slice(0, 8).toUpperCase();
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-border-light p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {isAr ? "تم استلام طلبك!" : "Request Received!"}
          </h2>
          <p className="text-text-muted text-sm mb-5">
            {isAr
              ? "سيتواصل معك فريقنا في أقرب وقت. رقم تتبع طلبك:"
              : "Our team will contact you shortly. Your tracking number:"}
          </p>
          <div className="bg-bg-alt rounded-xl px-6 py-4 mb-6">
            <p className="text-xs text-text-muted mb-1">{isAr ? "رقم التتبع" : "Tracking ID"}</p>
            <p className="text-2xl font-bold text-brand-green font-mono tracking-widest">{trackingCode}</p>
          </div>
          <p className="text-xs text-text-muted mb-6">
            {isAr
              ? "احتفظ بهذا الرقم — ستحتاجه لمتابعة حالة طلبك"
              : "Keep this number — you'll need it to track your request"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/dashboard/travel/${submitted.id}`)}
              className="flex-1 h-11 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-dark transition"
            >
              {isAr ? "تابع الطلب" : "View Request"}
            </button>
            <button
              onClick={() => setSubmitted(null)}
              className="px-5 h-11 border border-border-light rounded-xl text-sm text-text-secondary hover:bg-bg-alt transition"
            >
              {isAr ? "طلب جديد" : "New Request"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-5 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        {isAr ? "رجوع" : "Back"}
      </button>

      <div className="bg-white rounded-2xl border border-border-light p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-text-primary">
            {isAr ? "طلب سفر جديد" : "New Travel Request"}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {isAr
              ? "أكمل المعلومات الأساسية فقط — يمكنك إضافة المستندات لاحقاً"
              : "Fill in basic info only — you can add documents later"}
          </p>
        </div>

        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Travel type */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              {isAr ? "نوع الخدمة" : "Service Type"} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={isAr ? "نوع الخدمة" : "Service type"}>
              {TRAVEL_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue("travel_type", t.value)}
                  aria-pressed={selectedType === t.value}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all text-right",
                    selectedType === t.value
                      ? "border-brand-green bg-brand-green/5 text-brand-green"
                      : "border-border-light text-text-secondary hover:border-gray-300"
                  )}
                >
                  <span className="text-xl" aria-hidden="true">{t.icon}</span>
                  <span>{isAr ? t.labelAr : t.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label htmlFor="destination" className="block text-sm font-semibold text-text-secondary mb-1">
              {isAr ? "الوجهة" : "Destination"} <span className="text-red-500">*</span>
            </label>
            <select
              id="destination"
              {...register("destination_country")}
              className={cn(inputCls, "appearance-none", errors.destination_country && "border-red-400")}
            >
              <option value="">{isAr ? "اختر الوجهة" : "Select destination"}</option>
              {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.destination_country && (
              <p className="text-xs text-red-500 mt-1">{errors.destination_country.message}</p>
            )}
          </div>

          {/* Traveler count */}
          <div>
            <label htmlFor="traveler_count" className="block text-sm font-semibold text-text-secondary mb-1">
              {isAr ? "عدد المسافرين" : "Number of Travelers"} <span className="text-red-500">*</span>
            </label>
            <input
              id="traveler_count"
              {...register("traveler_count", { valueAsNumber: true })}
              type="number"
              min={1}
              max={20}
              className={cn(inputCls, errors.traveler_count && "border-red-400")}
            />
            {errors.traveler_count && (
              <p className="text-xs text-red-500 mt-1">{errors.traveler_count.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="departure_date" className="block text-sm font-semibold text-text-secondary mb-1">
                {isAr ? "تاريخ السفر" : "Departure Date"}
              </label>
              <input id="departure_date" {...register("departure_date")} type="date" className={inputCls} />
            </div>
            <div>
              <label htmlFor="return_date" className="block text-sm font-semibold text-text-secondary mb-1">
                {isAr ? "تاريخ العودة" : "Return Date"}
              </label>
              <input id="return_date" {...register("return_date")} type="date" className={inputCls} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="customer_notes" className="block text-sm font-semibold text-text-secondary mb-1">
              {isAr ? "ملاحظات إضافية" : "Additional Notes"}
            </label>
            <textarea
              id="customer_notes"
              {...register("customer_notes")}
              rows={3}
              placeholder={isAr ? "أي تفاصيل إضافية..." : "Any additional details..."}
              className={cn(inputCls, "h-auto py-2.5")}
            />
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4" role="note">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-xs text-blue-700">
              {isAr
                ? "سيتم تسجيل طلبك فوراً وتعيين رقم تتبع. يمكنك إرفاق المستندات لاحقاً."
                : "Your request will be recorded immediately and assigned a tracking number. You can attach documents later."}
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "w-full h-12 rounded-xl text-white font-bold text-sm transition",
              submitting ? "bg-brand-green/50 cursor-not-allowed" : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
            )}
          >
            {submitting
              ? (isAr ? "جاري إرسال الطلب..." : "Submitting...")
              : (isAr ? "إرسال الطلب" : "Submit Request")}
          </button>
        </form>
      </div>
    </div>
  );
}
