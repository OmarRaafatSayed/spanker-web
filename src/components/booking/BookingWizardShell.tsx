"use client";

import { cn } from "@/lib/utils";
import type { WizardStep } from "@/hooks/useBookingWizard";

interface BookingWizardShellProps {
  steps: WizardStep[];
  currentStep: number;
  title: string;
  titleAr: string;
  children: React.ReactNode;
  locale?: "ar" | "en";
  isRTL?: boolean;
}

export function BookingWizardShell({
  steps,
  currentStep,
  title,
  titleAr,
  children,
  locale = "ar",
  isRTL = true,
}: BookingWizardShellProps) {
  const displayTitle = locale === "ar" ? titleAr : title;

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-brand-green/5 to-brand-yellow/5",
        isRTL ? "rtl" : "ltr"
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="bg-white border-b border-border-light sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-text-primary">{displayTitle}</h1>
          {/* Stepper */}
          <div className="mt-4 flex items-center gap-0">
            {steps.map((step, i) => {
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              const isUpcoming = i > currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  {/* Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
                        isDone && "bg-brand-green border-brand-green text-white",
                        isCurrent && "bg-white border-brand-green text-brand-green",
                        isUpcoming && "bg-white border-border-default text-text-muted"
                      )}
                    >
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1 font-medium max-w-[60px] text-center leading-tight hidden sm:block",
                        isCurrent ? "text-brand-green" : "text-text-muted"
                      )}
                    >
                      {locale === "ar" ? step.labelAr : step.label}
                    </span>
                  </div>
                  {/* Connector */}
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-1 mt-[-16px] sm:mt-[-18px] transition-all",
                        i < currentStep ? "bg-brand-green" : "bg-border-light"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

/* ── Reusable card wrapper ── */
export function WizardCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-border-light p-6", className)}>
      {children}
    </div>
  );
}

/* ── Section heading inside card ── */
export function WizardSectionTitle({ ar, en, locale = "ar" }: { ar: string; en: string; locale?: string }) {
  return (
    <h2 className="text-base font-bold text-text-primary mb-4 pb-2 border-b border-border-light">
      {locale === "ar" ? ar : en}
    </h2>
  );
}

/* ── Navigation buttons ── */
export function WizardNavButtons({
  onBack,
  onNext,
  isFirst,
  isLast,
  isSubmitting,
  backLabel = "السابق",
  nextLabel = "التالي",
  submitLabel = "تأكيد الحجز",
  locale = "ar",
}: {
  onBack: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  locale?: string;
}) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className={cn(
          "px-5 py-2.5 rounded-xl text-sm font-medium border border-border-default transition-all",
          isFirst
            ? "opacity-40 cursor-not-allowed text-text-muted"
            : "hover:bg-muted text-text-secondary"
        )}
      >
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={isSubmitting}
        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-brand-green text-white hover:bg-brand-green-dark transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isSubmitting && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        )}
        {isLast ? submitLabel : nextLabel}
      </button>
    </div>
  );
}

/* ── Error banner ── */
export function WizardError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {message}
    </div>
  );
}

/* ── Success screen (last step) ── */
export function WizardSuccess({
  reference,
  message,
  messageAr,
  expiresAt,
  locale = "ar",
  onDone,
}: {
  reference: string;
  message: string;
  messageAr: string;
  expiresAt?: string;
  locale?: string;
  onDone: () => void;
}) {
  const displayMsg = locale === "ar" ? messageAr : message;
  const expiryTime = expiresAt ? new Date(expiresAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="text-center py-8">
      {/* Checkmark */}
      <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3D6833" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">{displayMsg}</h2>
      <div className="inline-block bg-brand-green/10 text-brand-green font-mono font-bold text-lg px-4 py-2 rounded-xl mb-3">
        {reference}
      </div>
      {expiryTime && (
        <p className="text-sm text-text-muted mb-4">
          {locale === "ar" ? `ينتهي الحجز المؤقت الساعة ${expiryTime}` : `Booking hold expires at ${expiryTime}`}
        </p>
      )}
      <p className="text-sm text-text-secondary mb-6">
        {locale === "ar"
          ? "سيتواصل معك فريقنا لتأكيد الدفع"
          : "Our team will contact you to confirm payment"}
      </p>
      <button
        onClick={onDone}
        className="px-8 py-3 rounded-xl bg-brand-green text-white font-bold hover:bg-brand-green-dark transition-all"
      >
        {locale === "ar" ? "حجوزاتي" : "My Bookings"}
      </button>
    </div>
  );
}
