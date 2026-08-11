"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { LoginModal } from "@/components/ui/LoginModal";
import { uploadDocument } from "@/modules/visa";
import type { TravelRequest } from "@/types";

// ─── Required documents list ─────────────────────────────────────────────────
const REQUIRED_DOCS = [
  { type: "passport",        labelAr: "صورة جواز السفر",          labelEn: "Passport Copy",        accept: "image/*,.pdf" },
  { type: "photo",           labelAr: "صورة شخصية",               labelEn: "Personal Photo",       accept: "image/*" },
  { type: "bank_statement",  labelAr: "كشف حساب بنكي (3 أشهر)",   labelEn: "Bank Statement (3mo)", accept: "image/*,.pdf" },
  { type: "hotel_booking",   labelAr: "حجز فندق",                  labelEn: "Hotel Booking",        accept: "image/*,.pdf" },
  { type: "flight_ticket",   labelAr: "تذكرة الطيران",             labelEn: "Flight Ticket",        accept: "image/*,.pdf" },
  { type: "employment_letter", labelAr: "خطاب عمل / إثبات دخل",  labelEn: "Employment Letter",    accept: "image/*,.pdf" },
];

type DocStatus = "idle" | "uploading" | "done" | "error";
interface DocState { status: DocStatus; fileName?: string; error?: string; }

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, isAr }: { step: number; isAr: boolean }) {
  const steps = isAr
    ? ["تسجيل الدخول", "بيانات الطلب", "رفع المستندات", "مكتمل"]
    : ["Sign In", "Request Info", "Upload Docs", "Done"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8" dir="ltr" role="list" aria-label={isAr ? "خطوات التقديم" : "Application steps"}>
      {steps.map((label, i) => {
        const active  = i + 1 === step;
        const done    = i + 1 < step;
        return (
          <div key={i} className="flex items-center" role="listitem">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300",
                done  ? "bg-brand-green border-brand-green text-white"
                      : active ? "bg-brand-yellow border-brand-yellow text-[#1b4332]"
                               : "bg-white border-border-light text-text-muted"
              )}>
                {done ? "✓" : i + 1}
              </div>
              <span className={cn("text-[10px] mt-1 font-medium whitespace-nowrap",
                active ? "text-brand-green" : "text-text-muted"
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 w-8 md:w-14 mx-1 mb-4 transition-colors duration-300",
                done ? "bg-brand-green" : "bg-border-light"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Document upload row ──────────────────────────────────────────────────────
function DocRow({
  doc, state, onPick, isAr,
}: {
  doc: typeof REQUIRED_DOCS[0];
  state: DocState;
  onPick: (file: File) => void;
  isAr: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = isAr ? doc.labelAr : doc.labelEn;

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200",
      state.status === "done"     ? "border-brand-green/40 bg-brand-green/5"
        : state.status === "error"  ? "border-red-300 bg-red-50"
        : state.status === "uploading" ? "border-brand-yellow/50 bg-brand-yellow/5"
        : "border-border-light bg-white hover:border-brand-green/30"
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm",
          state.status === "done" ? "bg-brand-green/15 text-brand-green"
            : state.status === "error" ? "bg-red-100 text-red-500"
            : "bg-bg-alt text-text-muted"
        )}>
          {state.status === "done" ? "✓" : state.status === "uploading" ? "⟳" : state.status === "error" ? "✕" : "○"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{label}</p>
          {state.fileName && <p className="text-[11px] text-text-muted truncate">{state.fileName}</p>}
          {state.error    && <p className="text-[11px] text-red-500">{state.error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={doc.accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
      />
      {state.status !== "uploading" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
            state.status === "done"
              ? "border border-brand-green/40 text-brand-green hover:bg-brand-green/10"
              : "bg-brand-green text-white hover:bg-brand-green-light"
          )}
        >
          {state.status === "done"
            ? (isAr ? "تغيير" : "Change")
            : (isAr ? "رفع" : "Upload")}
        </button>
      )}
      {state.status === "uploading" && (
        <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin shrink-0" />
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function VisaApplicationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const router = useRouter();

  const [loginOpen,   setLoginOpen]   = useState(false);
  const [step,        setStep]        = useState(1);  // 1=auth 2=form 3=upload 4=done
  const [request,     setRequest]     = useState<TravelRequest | null>(null);
  const [formData,    setFormData]    = useState({ destination: "Egypt", travelers: 1, departure: "", return: "", notes: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);
  const [docStates,   setDocStates]   = useState<Record<string, DocState>>(
    () => Object.fromEntries(REQUIRED_DOCS.map(d => [d.type, { status: "idle" as DocStatus }]))
  );

  // Step 1 → 2 when user signs in
  useEffect(() => {
    if (!authLoading && user && step === 1) setStep(2);
  }, [user, authLoading, step]);

  // ── Submit form ──
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch("/api/travel-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_user_id:      user.id,
          destination_country: formData.destination,
          travel_type:         "visa_only",
          departure_date:      formData.departure || null,
          return_date:         formData.return    || null,
          traveler_count:      formData.travelers,
          customer_notes:      formData.notes     || null,
        }),
      });

      const json = await res.json() as { success?: boolean; data?: TravelRequest; error?: string };

      if (!res.ok || !json.success || !json.data) {
        setFormError(json.error ?? (isAr ? "حدث خطأ، حاول مجدداً" : "Something went wrong, try again"));
        return;
      }

      setRequest(json.data);
      setStep(3);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : isAr ? "خطأ في الشبكة" : "Network error");
    } finally {
      setFormLoading(false);
    }
  }

  // ── Upload doc ──
  async function handleDocUpload(docType: string, file: File) {
    if (!request || !user) return;
    setDocStates(p => ({ ...p, [docType]: { status: "uploading" } }));

    try {
      const form = new FormData();
      form.append("file",         file);
      form.append("requestId",    request.id);
      form.append("clientUserId", user.id);
      form.append("documentType", docType);

      const res  = await fetch("/api/travel-requests/upload-document", { method: "POST", body: form });
      const json = await res.json() as { success?: boolean; error?: string };

      if (!res.ok || !json.success) {
        setDocStates(p => ({ ...p, [docType]: { status: "error", error: json.error ?? "Upload failed" } }));
      } else {
        setDocStates(p => ({ ...p, [docType]: { status: "done", fileName: file.name } }));
      }
    } catch (err) {
      setDocStates(p => ({ ...p, [docType]: { status: "error", error: err instanceof Error ? err.message : "Network error" } }));
    }
  }

  const uploadedCount = Object.values(docStates).filter(s => s.status === "done").length;
  const allDone = uploadedCount === REQUIRED_DOCS.length;

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-border-light px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-text-muted hover:text-brand-green transition" aria-label={isAr ? "رجوع" : "Back"}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-text-primary">{isAr ? "طلب تأشيرة مصر الإلكترونية" : "Egypt e-Visa Application"}</h1>
          <p className="text-xs text-text-muted">{isAr ? "أرسل مستنداتك وتابع حالة طلبك" : "Submit your documents and track your application"}</p>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <StepBar step={step} isAr={isAr} />

        <AnimatePresence mode="wait">

          {/* ── Step 1: Auth gate ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl border border-border-light p-8 text-center shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-green" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-primary mb-2">{isAr ? "سجّل دخولك أولاً" : "Sign in to continue"}</h2>
              <p className="text-sm text-text-muted mb-6">{isAr ? "تحتاج لحساب عشان تقدر تقدم على التأشيرة وتتابع حالتها" : "You need an account to apply and track your visa status"}</p>
              <button onClick={() => setLoginOpen(true)}
                className="w-full h-12 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light transition-colors"
              >{isAr ? "تسجيل الدخول / إنشاء حساب" : "Sign In / Create Account"}</button>
            </motion.div>
          )}

          {/* ── Step 2: Request form ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-border-light p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-text-primary">{isAr ? "بيانات الرحلة" : "Trip Details"}</h2>
                {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{isAr ? "عدد المسافرين" : "Travelers"}</label>
                  <input type="number" min={1} max={9} value={formData.travelers}
                    onChange={e => setFormData(p => ({ ...p, travelers: +e.target.value }))}
                    className="w-full h-11 px-3 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{isAr ? "تاريخ المغادرة" : "Departure"}</label>
                    <input type="date" value={formData.departure} min={new Date().toISOString().split("T")[0]}
                      onChange={e => setFormData(p => ({ ...p, departure: e.target.value }))}
                      className="w-full h-11 px-2 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/30 appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">{isAr ? "تاريخ العودة" : "Return"}</label>
                    <input type="date" value={formData.return} min={formData.departure}
                      onChange={e => setFormData(p => ({ ...p, return: e.target.value }))}
                      className="w-full h-11 px-2 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green appearance-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{isAr ? "ملاحظات إضافية" : "Additional notes"}</label>
                  <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    rows={2} placeholder={isAr ? "أي معلومات إضافية..." : "Any extra info..."}
                    className="w-full px-3 py-2 border border-border-light rounded-xl text-sm focus:outline-none focus:border-brand-green resize-none"
                  />
                </div>
                <button type="submit" disabled={formLoading}
                  className="w-full h-12 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light disabled:opacity-50 transition-colors"
                >{formLoading ? (isAr ? "جاري الإنشاء..." : "Creating...") : (isAr ? "التالي — رفع المستندات" : "Next — Upload Documents")}</button>
              </form>
            </motion.div>
          )}

          {/* ── Step 3: Document upload ── */}
          {step === 3 && request && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-text-primary">{isAr ? "ارفع المستندات المطلوبة" : "Upload Required Documents"}</h2>
                  <span className="text-sm font-bold text-brand-green">{uploadedCount}/{REQUIRED_DOCS.length}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-border-light overflow-hidden mb-5">
                  <motion.div className="h-full bg-brand-green rounded-full" animate={{ width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%` }} transition={{ duration: 0.4 }} />
                </div>
                <div className="space-y-2">
                  {REQUIRED_DOCS.map(doc => (
                    <DocRow key={doc.type} doc={doc} state={docStates[doc.type]} onPick={f => handleDocUpload(doc.type, f)} isAr={isAr} />
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(4)} disabled={!allDone}
                className="w-full h-12 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand-green text-white hover:bg-brand-green-light"
              >{isAr ? "إرسال الطلب" : "Submit Application"}</button>
              {!allDone && <p className="text-center text-xs text-text-muted">{isAr ? `ارفع ${REQUIRED_DOCS.length - uploadedCount} مستندات متبقية للمتابعة` : `Upload ${REQUIRED_DOCS.length - uploadedCount} more documents to continue`}</p>}
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-brand-green/30 p-8 text-center shadow-sm"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-5"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </motion.div>
              <h2 className="text-xl font-bold text-text-primary mb-2">{isAr ? "تم إرسال طلبك بنجاح!" : "Application Submitted!"}</h2>
              <p className="text-sm text-text-muted mb-1">{isAr ? "وصلنا كل المستندات بتاعتك" : "We've received all your documents"}</p>
              <p className="text-sm text-text-muted mb-6">{isAr ? "هتلاقي تحديث حالة طلبك في صفحة الحجوزات" : "Track your application status in your bookings"}</p>
              <div className="space-y-2">
                <button onClick={() => router.push("/dashboard/visa")}
                  className="w-full h-11 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light transition-colors text-sm"
                >{isAr ? "تابع حالة طلبك" : "Track Application Status"}</button>
                <button onClick={() => router.push("/")}
                  className="w-full h-11 border border-border-light text-text-secondary font-semibold rounded-xl hover:border-brand-green/40 hover:text-brand-green transition-colors text-sm"
                >{isAr ? "الرئيسية" : "Go Home"}</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <LoginModal open={loginOpen} onClose={() => { setLoginOpen(false); if (user) setStep(2); }} />
    </div>
  );
}
