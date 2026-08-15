"use client";

/**
 * /hotel-booking — Hotel Booking Request Page
 *
 * User Flow:
 *   1. If not logged in → show LoginModal → on success continue
 *   2. Step 1: Destination + Dates + Room/Guests
 *   3. Step 2: Contact confirmation + special requests
 *   4. Submit → POST /api/travel-requests (travel_type: "visa_hotel")
 *   5. Success screen with tracking ID
 *
 * CRM Pipeline:
 *   Supabase travel_requests (status: pending_documents)
 *   → CRM staff picks it up → generates quotation → sends to customer
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { LoginModal } from "@/components/ui/LoginModal";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
// travelRequestsService is kept as a fallback import for future use
// Hotel booking submits via the server-side API route to bypass RLS


// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z
  .object({
    destination_country: z.string().min(1, "اختر الوجهة"),
    check_in_date: z.string().min(1, "اختر تاريخ الوصول"),
    check_out_date: z.string().min(1, "اختر تاريخ المغادرة"),
    room_type: z.enum(["single", "double", "suite", "family"]),
    traveler_count: z.number().min(1).max(20),
    phone: z
      .string()
      .min(8, "رقم الهاتف غير صحيح")
      .regex(/^[+\d\s\-()]+$/, "رقم الهاتف غير صحيح"),
    customer_notes: z.string().optional(),
  })
  .refine(
    (d) => !d.check_in_date || !d.check_out_date || d.check_out_date > d.check_in_date,
    { message: "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول", path: ["check_out_date"] }
  );

type HotelBookingForm = z.infer<typeof schema>;

// ─── Static data ──────────────────────────────────────────────────────────────

const DESTINATIONS_AR = [
  "القاهرة", "الغردقة", "شرم الشيخ", "الأقصر", "أسوان", "الإسكندرية",
  "مرسى علم", "دبي", "أبوظبي", "إسطنبول", "بودابست", "لندن",
  "باريس", "برلين", "روما", "مدريد", "أثينا", "فيينا",
];

const DESTINATIONS_EN = [
  "Cairo", "Hurghada", "Sharm el-Sheikh", "Luxor", "Aswan", "Alexandria",
  "Marsa Alam", "Dubai", "Abu Dhabi", "Istanbul", "Budapest", "London",
  "Paris", "Berlin", "Rome", "Madrid", "Athens", "Vienna",
];

const ROOM_TYPES = [
  { value: "single" as const, labelAr: "غرفة مفردة",   labelEn: "Single Room",  icon: "🛏️", descAr: "شخص واحد",       descEn: "1 person" },
  { value: "double" as const, labelAr: "غرفة مزدوجة",  labelEn: "Double Room",  icon: "🛏️🛏️", descAr: "شخصان",        descEn: "2 persons" },
  { value: "suite"  as const, labelAr: "جناح فاخر",    labelEn: "Suite",        icon: "👑",  descAr: "إقامة مميزة",   descEn: "Premium stay" },
  { value: "family" as const, labelAr: "غرفة عائلية",  labelEn: "Family Room",  icon: "👨‍👩‍👧‍👦", descAr: "حتى 4 أفراد", descEn: "Up to 4 guests" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ step, isAr }: { step: 1 | 2; isAr: boolean }) {
  const steps = isAr
    ? ["تفاصيل الإقامة", "بيانات التواصل"]
    : ["Stay Details", "Contact Info"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8" dir="ltr">
      {steps.map((label, i) => {
        const active = i + 1 === step;
        const done   = i + 1 < step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300",
                  done  ? "bg-brand-green border-brand-green text-white"
                        : active ? "bg-brand-yellow border-brand-yellow text-brand-green-dark"
                                 : "bg-white/10 border-white/20 text-white/50"
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] mt-1.5 font-semibold whitespace-nowrap",
                  active ? "text-white" : done ? "text-brand-yellow" : "text-white/40"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-12 md:w-20 mx-2 mb-4 transition-all duration-500",
                  done ? "bg-brand-yellow" : "bg-white/15"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Night count badge ────────────────────────────────────────────────────────

function NightsBadge({ checkIn, checkOut, isAr }: { checkIn: string; checkOut: string; isAr: boolean }) {
  if (!checkIn || !checkOut) return null;
  const diff = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow text-xs font-bold px-2.5 py-1 rounded-full">
      🌙 {diff} {isAr ? (diff === 1 ? "ليلة" : "ليالي") : (diff === 1 ? "night" : "nights")}
    </span>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ trackingId, isAr }: { trackingId: string; isAr: boolean }) {
  const router = useRouter();
  const code = trackingId.slice(0, 8).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center max-w-md mx-auto"
    >
      {/* Animated checkmark */}
      <motion.div
        className="w-20 h-20 bg-brand-yellow/20 border-2 border-brand-yellow/50 rounded-full flex items-center justify-center mx-auto mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      >
        <motion.svg
          width="36" height="36" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-brand-yellow"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <motion.polyline points="22 4 12 14.01 9 11.01" />
        </motion.svg>
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {isAr ? "تم استلام طلبك! 🎉" : "Request Received! 🎉"}
      </h2>
      <p className="text-white/60 text-sm mb-6 leading-relaxed">
        {isAr
          ? "سيتواصل معك فريقنا خلال 24 ساعة بعرض مخصص لحجز فندقك. رقم متابعة طلبك:"
          : "Our team will contact you within 24 hours with a tailored hotel offer. Your request tracking number:"}
      </p>

      {/* Tracking code */}
      <div className="bg-white/5 border border-brand-yellow/30 rounded-2xl px-8 py-5 mb-6">
        <p className="text-xs text-white/40 mb-1 uppercase tracking-widest">
          {isAr ? "رقم التتبع" : "Tracking ID"}
        </p>
        <p className="text-3xl font-black text-brand-yellow tracking-widest font-mono">{code}</p>
      </div>

      {/* What happens next */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-start">
        <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">
          {isAr ? "الخطوات التالية" : "What happens next"}
        </p>
        {(isAr ? [
          ["📞", "فريقنا سيتصل بك", "خلال 24 ساعة"],
          ["💰", "ستحصل على عرض سعر مخصص", "طيران + فندق + خدمات"],
          ["✅", "بعد موافقتك نكمل الحجز", "ودفع مريح"],
        ] : [
          ["📞", "Our team will call you", "within 24 hours"],
          ["💰", "You'll get a tailored quote", "flights + hotel + services"],
          ["✅", "After your approval we finalize", "easy payment options"],
        ]).map(([icon, title, sub], i) => (
          <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
            <span className="text-lg mt-0.5">{icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-white/50">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/my-requests")}
          className="flex-1 h-12 bg-brand-green text-white font-bold rounded-xl text-sm hover:bg-brand-green-light transition-all active:scale-[0.98]"
        >
          {isAr ? "تابع طلبك" : "Track Request"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-5 h-12 border border-white/20 text-white/70 rounded-xl text-sm hover:bg-white/5 transition"
        >
          {isAr ? "الرئيسية" : "Home"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HotelBookingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  const [loginOpen,   setLoginOpen]   = useState(false);
  const [step,        setStep]        = useState<1 | 2>(1);
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted,   setSubmitted]   = useState<{ id: string } | null>(null);

  // If user lands here without auth, auto-open login modal
  useEffect(() => {
    if (!authLoading && !user) {
      setLoginOpen(true);
    }
  }, [authLoading, user]);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<HotelBookingForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      room_type: "double",
      traveler_count: 2,
    },
  });

  const watchedCheckIn  = watch("check_in_date");
  const watchedCheckOut = watch("check_out_date");
  const watchedRoomType = watch("room_type");

  // Advance to step 2 after validating step 1 fields
  async function goToStep2() {
    const valid = await trigger([
      "destination_country",
      "check_in_date",
      "check_out_date",
      "room_type",
      "traveler_count",
    ]);
    if (valid) setStep(2);
  }

  async function onSubmit(data: HotelBookingForm) {
    if (!user) { setLoginOpen(true); return; }

    setServerError(null);
    setSubmitting(true);

    // Build customer_notes combining room type + phone + user notes
    const roomLabel = ROOM_TYPES.find((r) => r.value === data.room_type);
    const notesPrefix = isAr
      ? `نوع الغرفة: ${roomLabel?.labelAr ?? data.room_type} | هاتف: ${data.phone}`
      : `Room type: ${roomLabel?.labelEn ?? data.room_type} | Phone: ${data.phone}`;
    const fullNotes = data.customer_notes
      ? `${notesPrefix}\n${data.customer_notes}`
      : notesPrefix;

    try {
      // Use the server-side API route (service_role key) to bypass RLS.
      // Direct Supabase client inserts fail when the session is a FastAPI JWT
      // because auth.uid() in Postgres returns NULL for non-Supabase tokens.
      const res = await fetch("/api/travel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_user_id:      user.id,
          destination_country: data.destination_country,
          travel_type:         "visa_hotel",
          departure_date:      data.check_in_date,
          return_date:         data.check_out_date,
          traveler_count:      data.traveler_count,
          customer_notes:      fullNotes,
        }),
      });

      const json = await res.json() as { success?: boolean; data?: { id: string }; error?: string };

      if (!res.ok || !json.success || !json.data) {
        setServerError(json.error ?? (isAr ? "فشل إرسال الطلب، حاول مجدداً" : "Failed to submit request, please try again"));
        return;
      }

      setSubmitted({ id: json.data.id });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : (isAr ? "خطأ في الاتصال" : "Connection error"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = cn(
    "w-full h-11 px-3 border rounded-xl text-sm transition-all duration-200",
    "bg-white/8 border-white/15 text-white placeholder-white/30",
    "focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 focus:border-brand-yellow/50"
  );
  const errCls = "text-xs text-red-400 mt-1";

  const today = new Date().toISOString().split("T")[0];

  // ── Destinations list
  const destinations = isAr ? DESTINATIONS_AR : DESTINATIONS_EN;

  return (
    <>
      <Navbar />
      <main className="min-h-screen section-dark pt-24 pb-24 lg:pb-10">
        {/* Background orb */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #3D6833 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative max-w-lg mx-auto px-4">

          {/* ── Page header ── */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Hotel icon */}
            <div className="w-14 h-14 rounded-2xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4 text-2xl">
              🏨
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {isAr ? "احجز فندقك الآن" : "Book Your Hotel"}
            </h1>
            <p className="text-white/55 text-sm">
              {isAr
                ? "أخبرنا عن إقامتك وسنرسل لك عرضاً مخصصاً خلال 24 ساعة"
                : "Tell us about your stay and we'll send you a tailored offer within 24 hours"}
            </p>
          </motion.div>

          {/* ── Content card ── */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {submitted ? (
              <SuccessScreen trackingId={submitted.id} isAr={isAr} />
            ) : (
              <>
                {/* Auth gate notice */}
                {!user && !authLoading && (
                  <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                    <span className="text-brand-yellow text-lg">🔒</span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {isAr ? "تسجيل الدخول مطلوب" : "Sign in required"}
                      </p>
                      <button
                        onClick={() => setLoginOpen(true)}
                        className="text-xs text-brand-yellow underline-offset-2 underline"
                      >
                        {isAr ? "سجّل دخولك للمتابعة" : "Sign in to continue"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step bar */}
                <StepBar step={step} isAr={isAr} />

                {/* Server error */}
                {serverError && (
                  <div
                    className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    role="alert"
                  >
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <AnimatePresence mode="wait">

                    {/* ══════════════ STEP 1 ══════════════ */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        {/* Destination */}
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-1.5">
                            {isAr ? "الوجهة" : "Destination"} <span className="text-brand-yellow">*</span>
                          </label>
                          <select
                            {...register("destination_country")}
                            className={cn(inputCls, "appearance-none", errors.destination_country && "border-red-500/60")}
                          >
                            <option value="" className="bg-[#0f1a0b]">
                              {isAr ? "اختر الوجهة" : "Select destination"}
                            </option>
                            {destinations.map((d) => (
                              <option key={d} value={d} className="bg-[#0f1a0b]">{d}</option>
                            ))}
                          </select>
                          {errors.destination_country && (
                            <p className={errCls}>{errors.destination_country.message}</p>
                          )}
                        </div>

                        {/* Check-in / Check-out */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-white/80 mb-1.5">
                              {isAr ? "تاريخ الوصول" : "Check-in"} <span className="text-brand-yellow">*</span>
                            </label>
                            <input
                              {...register("check_in_date")}
                              type="date"
                              min={today}
                              className={cn(inputCls, errors.check_in_date && "border-red-500/60",
                                "[color-scheme:dark]")}
                            />
                            {errors.check_in_date && (
                              <p className={errCls}>{errors.check_in_date.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white/80 mb-1.5">
                              {isAr ? "تاريخ المغادرة" : "Check-out"} <span className="text-brand-yellow">*</span>
                            </label>
                            <input
                              {...register("check_out_date")}
                              type="date"
                              min={watchedCheckIn || today}
                              className={cn(inputCls, errors.check_out_date && "border-red-500/60",
                                "[color-scheme:dark]")}
                            />
                            {errors.check_out_date && (
                              <p className={errCls}>{errors.check_out_date.message}</p>
                            )}
                          </div>
                        </div>

                        {/* Nights badge */}
                        {watchedCheckIn && watchedCheckOut && (
                          <div className="flex justify-center">
                            <NightsBadge
                              checkIn={watchedCheckIn}
                              checkOut={watchedCheckOut}
                              isAr={isAr}
                            />
                          </div>
                        )}

                        {/* Room type */}
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-2">
                            {isAr ? "نوع الغرفة" : "Room Type"} <span className="text-brand-yellow">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {ROOM_TYPES.map((room) => (
                              <button
                                key={room.value}
                                type="button"
                                onClick={() => setValue("room_type", room.value)}
                                aria-pressed={watchedRoomType === room.value}
                                className={cn(
                                  "flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-sm transition-all duration-200",
                                  watchedRoomType === room.value
                                    ? "border-brand-yellow/60 bg-brand-yellow/10 text-white"
                                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                                )}
                              >
                                <span className="text-xl">{room.icon}</span>
                                <span className="font-semibold text-xs">
                                  {isAr ? room.labelAr : room.labelEn}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {isAr ? room.descAr : room.descEn}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Traveler count */}
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-1.5">
                            {isAr ? "عدد الضيوف" : "Number of Guests"} <span className="text-brand-yellow">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const v = watch("traveler_count");
                                if (v > 1) setValue("traveler_count", v - 1);
                              }}
                              className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-white font-bold hover:bg-white/10 transition text-lg"
                              aria-label={isAr ? "تقليل" : "Decrease"}
                            >
                              −
                            </button>
                            <div className="flex-1 h-11 flex items-center justify-center font-bold text-white text-lg bg-white/5 border border-white/15 rounded-xl">
                              {watch("traveler_count")}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const v = watch("traveler_count");
                                if (v < 20) setValue("traveler_count", v + 1);
                              }}
                              className="w-10 h-10 rounded-xl border border-white/15 bg-white/5 text-white font-bold hover:bg-white/10 transition text-lg"
                              aria-label={isAr ? "زيادة" : "Increase"}
                            >
                              +
                            </button>
                          </div>
                          {errors.traveler_count && (
                            <p className={errCls}>{errors.traveler_count.message}</p>
                          )}
                        </div>

                        {/* Next button */}
                        <button
                          type="button"
                          onClick={goToStep2}
                          disabled={!user}
                          className={cn(
                            "w-full h-12 rounded-xl font-bold text-sm transition-all duration-200",
                            user
                              ? "bg-brand-green text-white hover:bg-brand-green-light active:scale-[0.98] shadow-lg shadow-brand-green/20"
                              : "bg-white/10 text-white/30 cursor-not-allowed"
                          )}
                        >
                          {isAr ? "التالي: بيانات التواصل ←" : "Next: Contact Info →"}
                        </button>
                      </motion.div>
                    )}

                    {/* ══════════════ STEP 2 ══════════════ */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-5"
                      >
                        {/* Booking summary */}
                        <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl p-4">
                          <p className="text-xs font-bold text-brand-yellow uppercase tracking-widest mb-3">
                            {isAr ? "ملخص الحجز" : "Booking Summary"}
                          </p>
                          <div className="space-y-2 text-sm">
                            <SummaryRow
                              icon="📍"
                              label={isAr ? "الوجهة" : "Destination"}
                              value={watch("destination_country")}
                            />
                            <SummaryRow
                              icon="📅"
                              label={isAr ? "الوصول" : "Check-in"}
                              value={formatDate(watch("check_in_date"), isAr)}
                            />
                            <SummaryRow
                              icon="📅"
                              label={isAr ? "المغادرة" : "Check-out"}
                              value={formatDate(watch("check_out_date"), isAr)}
                            />
                            <SummaryRow
                              icon="🛏️"
                              label={isAr ? "الغرفة" : "Room"}
                              value={
                                ROOM_TYPES.find((r) => r.value === watch("room_type"))?.[
                                  isAr ? "labelAr" : "labelEn"
                                ] ?? ""
                              }
                            />
                            <SummaryRow
                              icon="👥"
                              label={isAr ? "الضيوف" : "Guests"}
                              value={String(watch("traveler_count"))}
                            />
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <NightsBadge
                              checkIn={watch("check_in_date")}
                              checkOut={watch("check_out_date")}
                              isAr={isAr}
                            />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-1.5">
                            {isAr ? "رقم الهاتف" : "Phone Number"} <span className="text-brand-yellow">*</span>
                          </label>
                          <input
                            {...register("phone")}
                            type="tel"
                            dir="ltr"
                            placeholder="+20 10 0000 0000"
                            className={cn(inputCls, errors.phone && "border-red-500/60")}
                          />
                          {errors.phone ? (
                            <p className={errCls}>{errors.phone.message}</p>
                          ) : (
                            <p className="text-xs text-white/35 mt-1">
                              {isAr ? "سيتواصل معك فريقنا على هذا الرقم" : "Our team will call you on this number"}
                            </p>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-semibold text-white/80 mb-1.5">
                            {isAr ? "طلبات خاصة (اختياري)" : "Special Requests (optional)"}
                          </label>
                          <textarea
                            {...register("customer_notes")}
                            rows={3}
                            placeholder={
                              isAr
                                ? "مثال: غرفة بإطلالة على البحر، سرير إضافي للأطفال..."
                                : "e.g. sea view room, extra bed for children..."
                            }
                            className={cn(inputCls, "h-auto py-3 resize-none")}
                          />
                        </div>

                        {/* Info notice */}
                        <div
                          className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5"
                          role="note"
                        >
                          <svg
                            width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            className="text-brand-yellow shrink-0 mt-0.5"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          <p className="text-xs text-white/50 leading-relaxed">
                            {isAr
                              ? "طلبك سيُسجّل فوراً وسيتواصل معك فريقنا خلال 24 ساعة بعرض سعر مخصص. لا يوجد دفع الآن."
                              : "Your request will be recorded immediately and our team will contact you within 24 hours with a custom price offer. No payment required now."}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 h-12 border border-white/15 text-white/60 rounded-xl text-sm hover:bg-white/5 transition"
                          >
                            {isAr ? "→ رجوع" : "← Back"}
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className={cn(
                              "flex-1 h-12 rounded-xl text-sm font-bold transition-all duration-200",
                              submitting
                                ? "bg-brand-green/40 text-white/50 cursor-not-allowed"
                                : "bg-brand-green text-white hover:bg-brand-green-light active:scale-[0.98] shadow-lg shadow-brand-green/20"
                            )}
                          >
                            {submitting
                              ? (isAr ? "⏳ جاري إرسال الطلب..." : "⏳ Submitting...")
                              : (isAr ? "✓ أرسل طلب الحجز" : "✓ Submit Booking Request")}
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
      <BottomNav />

      {/* Auth modal */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/50 flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        {label}
      </span>
      <span className="font-semibold text-white text-end">{value}</span>
    </div>
  );
}

function formatDate(dateStr: string, isAr: boolean): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(isAr ? "ar-EG" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
