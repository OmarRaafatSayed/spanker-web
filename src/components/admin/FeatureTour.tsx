"use client";

/**
 * <FeatureTour>
 * A branded feature-tour popup that slides in the first time an admin
 * visits a section. Steps through 5–8 key capabilities with icons,
 * descriptions, and a progress bar. Uses brand-green + brand-yellow.
 *
 * Dismissed state stored in localStorage so it only shows once per section.
 * Admin can re-open it via the "?" help button in the sidebar footer.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  X, ChevronLeft, ChevronRight, CheckCircle2,
  Sparkles, BookOpen, Users, Hotel, Map, Tag,
  FileText, BarChart3, Settings2, ShieldCheck,
} from "lucide-react";

// ─── Tour content per page ────────────────────────────────────────────────────

export interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  tip?: string;
}

export interface TourConfig {
  pageTitle: string;
  pageIcon: React.ReactNode;
  accent: string;       // Tailwind bg class for step number
  steps: TourStep[];
}

const iconCls = "w-5 h-5";

export const TOURS: Record<string, TourConfig> = {

  "/admin": {
    pageTitle: "لوحة التحكم",
    pageIcon: <Sparkles className={iconCls} />,
    accent: "bg-brand-green",
    steps: [
      {
        icon: <BarChart3 className={iconCls} />,
        title: "نظرة عامة فورية",
        description: "تظهر لك لوحة التحكم إجمالي الحجوزات، الإيرادات، والمهام المعلقة في لحظة واحدة.",
        tip: "البيانات تتحدث في الوقت الفعلي عبر Supabase Realtime.",
      },
      {
        icon: <BookOpen className={iconCls} />,
        title: "آخر الحجوزات",
        description: "أحدث الحجوزات تظهر مباشرةً بحالتها: قيد الانتظار، مؤكد، أو ملغي.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "أداء الموظفين",
        description: "قسم 'أفضل الموظفين' يعرض أعلى 5 موظفين إنجازاً هذا الشهر.",
      },
      {
        icon: <Tag className={iconCls} />,
        title: "الإجراءات السريعة",
        description: "الأزرار السريعة في الأعلى تمكنك من الانتقال الفوري لأي قسم أو إضافة محتوى جديد.",
      },
      {
        icon: <Settings2 className={iconCls} />,
        title: "أوامر سريعة",
        description: "اضغط Ctrl+K في أي وقت لفتح لوح الأوامر والبحث عن أي صفحة أو حجز بسرعة.",
        tip: "اختصار مفيد جداً أثناء العمل على حجوزات متعددة.",
      },
    ],
  },

  "/admin/bookings": {
    pageTitle: "الحجوزات",
    pageIcon: <BookOpen className={iconCls} />,
    accent: "bg-brand-green",
    steps: [
      {
        icon: <BookOpen className={iconCls} />,
        title: "إدارة جميع الحجوزات",
        description: "تشمل: طيران، فنادق، رحلات سياحية، وتأشيرات. كل حجز في مكان واحد.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "تأكيد وإلغاء الحجوزات",
        description: "اضغط 'تأكيد' لتغيير حالة الحجز إلى مؤكد، أو 'إلغاء' لإبلاغ العميل فوراً.",
        tip: "التغيير يُرسل إشعاراً تلقائياً للعميل.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "إسناد الموظف",
        description: "كل حجز يمكن إسناده لموظف معين ليتابعه ويتواصل مع العميل.",
      },
      {
        icon: <FileText className={iconCls} />,
        title: "الملاحظات الداخلية",
        description: "أضف ملاحظات داخلية على أي حجز — تظهر للموظفين فقط ولا يراها العميل.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "تصدير البيانات",
        description: "زر 'تصدير' يُنزّل قائمة الحجوزات الحالية كملف Excel مع كل الفلاتر المطبقة.",
      },
      {
        icon: <Settings2 className={iconCls} />,
        title: "الفلترة المتقدمة",
        description: "فلتر حسب الحالة، النوع، التاريخ، المبلغ، والموظف المُسند في نفس الوقت.",
        tip: "اضغط زر 'فلترة متقدمة' للوصول لجميع الخيارات.",
      },
    ],
  },

  "/admin/leads": {
    pageTitle: "العملاء المحتملون",
    pageIcon: <Users className={iconCls} />,
    accent: "bg-blue-600",
    steps: [
      {
        icon: <Users className={iconCls} />,
        title: "متابعة طلبات العملاء",
        description: "كل طلب سفر من العملاء يظهر هنا كـ Lead تتابعه حتى يتحول إلى حجز مؤكد.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "تغيير حالة الطلب",
        description: "حرك الطلب خلال المراحل: جديد ← قيد المعالجة ← عرض سعر ← مؤكد ← مكتمل.",
      },
      {
        icon: <FileText className={iconCls} />,
        title: "المستندات المطلوبة",
        description: "اطّلع على المستندات التي رفعها العميل واعتمدها أو اطلب إضافة مستندات جديدة.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "إسناد للموظفين",
        description: "أسند كل Lead لموظف محدد ليتابعه ويتواصل مع العميل مباشرة.",
        tip: "الإسناد يظهر في صفحة 'حجوزاتي' للموظف.",
      },
      {
        icon: <Settings2 className={iconCls} />,
        title: "ملاحظات التواصل",
        description: "سجّل كل اتصال أو رسالة مع العميل كتاريخ تواصل مرتب زمنياً.",
      },
    ],
  },

  "/admin/hotels": {
    pageTitle: "الفنادق",
    pageIcon: <Hotel className={iconCls} />,
    accent: "bg-amber-600",
    steps: [
      {
        icon: <Hotel className={iconCls} />,
        title: "إضافة وتعديل الفنادق",
        description: "أضف فنادقك مع: النجوم، نوع الغرفة، نظام الوجبات، المرافق، والتسعير.",
      },
      {
        icon: <Tag className={iconCls} />,
        title: "سعر الليلة والعروض",
        description: "حدد سعر الليلة العادي وأضف سعر عرض خاص — يظهر للعملاء مع شطب السعر القديم.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "المرافق والخدمات",
        description: "اختر من قائمة المرافق الجاهزة: واي فاي، مسبح، سبا، إفطار، مواقف... وغيرها.",
        tip: "المرافق تظهر كـ chips ملونة على صفحة الفندق للعميل.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "فترات الإتاحة",
        description: "حدد فترة الإتاحة (من/إلى) وعدد الغرف المتاحة لمنع الحجز الزائد.",
      },
      {
        icon: <Settings2 className={iconCls} />,
        title: "استيراد من Excel",
        description: "لديك قائمة فنادق؟ استوردها دفعةً واحدة من ملف CSV أو JSON باستخدام زر 'استيراد'.",
        tip: "اضغط 'تحميل نموذج CSV' للحصول على التنسيق الصحيح.",
      },
    ],
  },

  "/admin/packages": {
    pageTitle: "الرحلات",
    pageIcon: <Map className={iconCls} />,
    accent: "bg-brand-green",
    steps: [
      {
        icon: <Map className={iconCls} />,
        title: "رحلات داخلية ودولية",
        description: "أضف رحلات مصرية (داخلية) أو دولية — كل نوع يظهر بتصنيف مختلف للعملاء.",
      },
      {
        icon: <FileText className={iconCls} />,
        title: "برنامج يومي تفصيلي",
        description: "اكتب البرنامج يوماً بيوم في تبويب 'برنامج الرحلة' — كل سطر = يوم واحد.",
        tip: "التنسيق: يوم 1: العنوان - الوصف",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "يشمل / لا يشمل",
        description: "حدد ما يشمله العرض وما لا يشمله — يظهر للعميل بشكل واضح قبل الحجز.",
      },
      {
        icon: <Tag className={iconCls} />,
        title: "معاينة حية",
        description: "تبويب 'معاينة' يعرض كيف ستبدو الرحلة بالضبط على الموقع قبل النشر.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "استيراد Excel دفعي",
        description: "حمّل نموذج Excel الجاهز وأدخل بيانات عدة رحلات دفعةً واحدة.",
        tip: "النموذج يحتوي ورقة تعليمات كاملة بكل الأعمدة المطلوبة.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "إدارة المقاعد",
        description: "حدد عدد المقاعد المتاحة والحد الأقصى للمجموعة — يُحدَّث تلقائياً مع كل حجز.",
      },
    ],
  },

  "/admin/offers": {
    pageTitle: "العروض الخاصة",
    pageIcon: <Tag className={iconCls} />,
    accent: "bg-red-500",
    steps: [
      {
        icon: <Tag className={iconCls} />,
        title: "إدارة العروض الترويجية",
        description: "كل عرض تضيفه هنا يظهر فوراً على صفحة 'العروض الخاصة' للعملاء.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "حساب الخصم التلقائي",
        description: "أدخل السعر الأصلي والسعر بعد الخصم — النسبة تُحسب تلقائياً وتظهر للعميل.",
      },
      {
        icon: <Map className={iconCls} />,
        title: "أنواع العروض",
        description: "حدد نوع العرض: طيران، فندق، تأشيرة، أو باقة سياحية — يُصنَّف تلقائياً للعملاء.",
      },
      {
        icon: <Settings2 className={iconCls} />,
        title: "الشارات والإيموجي",
        description: "أضف شارة جذابة (مثل 🔥 الأكثر مبيعاً) وإيموجي يُعبّر عن الوجهة.",
        tip: "الشارة تظهر فوق الصورة في الكارد وتجذب انتباه العميل.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "تواريخ الصلاحية",
        description: "حدد تاريخ انتهاء العرض — يظهر تنبيه برتقالي عند اقتراب الانتهاء (3 أيام).",
      },
      {
        icon: <FileText className={iconCls} />,
        title: "صورة وما يشمل",
        description: "ارفع صورة الغلاف وأضف قائمة 'يشمل العرض' سطراً بسطر — تظهر في الكارد.",
      },
    ],
  },

  "/admin/documents": {
    pageTitle: "المستندات",
    pageIcon: <FileText className={iconCls} />,
    accent: "bg-purple-600",
    steps: [
      {
        icon: <FileText className={iconCls} />,
        title: "مراجعة مستندات العملاء",
        description: "كل مستند يرفعه العميل (جواز سفر، صور...) يظهر هنا للمراجعة والاعتماد.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "قبول أو رفض المستند",
        description: "اضغط 'موافقة' لقبول المستند أو 'رفض' مع ذكر السبب — يصل إشعار للعميل فوراً.",
      },
      {
        icon: <Tag className={iconCls} />,
        title: "فلترة حسب الحالة",
        description: "صفّح المستندات حسب: قيد المراجعة، تمت الموافقة، مرفوض، أو نوع المستند.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "ربط بالحجوزات",
        description: "كل مستند مرتبط بحجز وعميل محدد — اضغط على الحجز للاطلاع على التفاصيل الكاملة.",
      },
    ],
  },

  "/admin/analytics": {
    pageTitle: "التحليلات",
    pageIcon: <BarChart3 className={iconCls} />,
    accent: "bg-indigo-600",
    steps: [
      {
        icon: <BarChart3 className={iconCls} />,
        title: "إحصائيات الأداء",
        description: "اطّلع على إجمالي الحجوزات، الإيرادات، ومعدل التحويل خلال 7/30/90 يوم.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "أداء الموظفين",
        description: "قارن أداء الفريق — من الأعلى إنجازاً والأسرع استجابةً للعملاء.",
      },
      {
        icon: <Map className={iconCls} />,
        title: "الوجهات الأكثر طلباً",
        description: "شاهد أي الوجهات تجذب أكثر الحجوزات وخطط عروضك بناءً عليها.",
      },
      {
        icon: <Tag className={iconCls} />,
        title: "تصدير التقارير",
        description: "صدّر أي تقرير كملف Excel بضغطة واحدة لمشاركته مع الإدارة.",
      },
    ],
  },

  "/admin/workflows": {
    pageTitle: "سير العمل",
    pageIcon: <Settings2 className={iconCls} />,
    accent: "bg-teal-600",
    steps: [
      {
        icon: <Settings2 className={iconCls} />,
        title: "مهام التشغيل التلقائي",
        description: "تشغيل مهام دورية: إنهاء صلاحية الحجوزات المعلقة، إرسال التذكيرات، وترقية المهام.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "سجل التنفيذ",
        description: "كل مهمة تُنفَّذ يُسجَّل وقتها ونتيجتها (نجاح/فشل) مع عدد السجلات المتأثرة.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "تشغيل يدوي",
        description: "يمكنك تشغيل أي مهمة يدوياً في أي وقت بدلاً من انتظار الجدول الزمني.",
        tip: "مفيد عند الحاجة لتنظيف البيانات فوراً.",
      },
    ],
  },

  "/admin/visas": {
    pageTitle: "التأشيرات",
    pageIcon: <ShieldCheck className={iconCls} />,
    accent: "bg-blue-600",
    steps: [
      {
        icon: <ShieldCheck className={iconCls} />,
        title: "طلبات التأشيرة",
        description: "استعرض جميع طلبات التأشيرة المقدمة من العملاء ومتابعة مراحلها.",
      },
      {
        icon: <CheckCircle2 className={iconCls} />,
        title: "مراجعة وإقرار الطلبات",
        description: "راجع مستندات الطلب وأقرّه أو ارفضه مع ملاحظات تصل للعميل.",
      },
      {
        icon: <FileText className={iconCls} />,
        title: "متطلبات كل تأشيرة",
        description: "حدد قائمة المستندات المطلوبة لكل نوع تأشيرة — تظهر للعميل قبل التقديم.",
      },
      {
        icon: <BarChart3 className={iconCls} />,
        title: "تتبع الحالة",
        description: "تاريخ كامل لكل تغيير في حالة الطلب مع توقيت واسم الموظف المسؤول.",
      },
      {
        icon: <Users className={iconCls} />,
        title: "التواصل مع العميل",
        description: "أرسل رسائل مباشرة للعميل داخل النظام لطلب مستندات إضافية أو لتأكيد الطلب.",
      },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface FeatureTourProps {
  /** The pathname this tour belongs to. Matches keys in TOURS. */
  pathname: string;
}

const STORAGE_KEY = "admin_tour_seen_v2";

function getSeenTours(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function markSeen(path: string) {
  const seen = getSeenTours();
  seen[path] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
}

export function FeatureTour({ pathname }: FeatureTourProps) {
  const config = TOURS[pathname];
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState(0);
  const [visible, setVisible] = useState(false); // for animation

  useEffect(() => {
    if (!config) return;
    const seen = getSeenTours();
    if (!seen[pathname]) {
      // Slight delay so page content renders first
      const t = setTimeout(() => { setOpen(true); setStep(0); setVisible(true); }, 600);
      return () => clearTimeout(t);
    }
  }, [pathname, config]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOpen(false), 250);
    markSeen(pathname);
  }, [pathname]);

  if (!config || !open) return null;

  const steps = config.steps;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className={cn(
        "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-250",
        visible ? "opacity-100" : "opacity-0"
      )} />

      {/* Card */}
      <div className={cn(
        "relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden",
        "transition-all duration-250",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
      )} dir="rtl">

        {/* Top accent stripe */}
        <div className={cn("h-1.5 w-full", config.accent)} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0", config.accent)}>
              {config.pageIcon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">جولة تعريفية</p>
              <h3 className="text-base font-black text-text-primary leading-tight">{config.pageTitle}</h3>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-xl hover:bg-muted text-text-muted hover:text-text-primary transition-all shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mx-6 mb-5">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-400", config.accent)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  i === step ? cn("scale-125", config.accent) : i < step ? "bg-gray-300" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6">
          <div className="flex items-start gap-4">
            {/* Step number + icon */}
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md",
                config.accent
              )}>
                {current.icon}
              </div>
              <span className="text-[10px] font-bold text-text-muted">{step + 1}/{steps.length}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-primary text-sm mb-1.5">{current.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{current.description}</p>

              {current.tip && (
                <div className="mt-3 flex items-start gap-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-3 py-2">
                  <span className="text-brand-yellow text-base shrink-0">💡</span>
                  <p className="text-xs text-text-secondary leading-relaxed">{current.tip}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-gray-50/50">
          {/* Skip */}
          <button onClick={close} className="text-xs text-text-muted hover:text-text-secondary transition-colors font-medium">
            تخطي الجولة
          </button>

          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                step === 0
                  ? "opacity-30 cursor-not-allowed border-border-default text-text-muted"
                  : "border-border-default text-text-secondary hover:bg-muted"
              )}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              السابق
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm",
                  config.accent, "hover:opacity-90"
                )}
              >
                التالي
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={close}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm",
                  config.accent, "hover:opacity-90"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                فهمت!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Re-open button (rendered in sidebar footer) ──────────────────────────────

interface TourTriggerProps {
  pathname: string;
  className?: string;
}

export function TourTrigger({ pathname, className }: TourTriggerProps) {
  const [open, setOpen] = useState(false);
  const config = TOURS[pathname];
  if (!config) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); }}
        title="جولة تعريفية"
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-brand-green hover:bg-brand-green/10 transition-all",
          className
        )}
      >
        <span className="text-base font-black">?</span>
      </button>

      {open && (
        <FeatureTourManual
          pathname={pathname}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Manual (triggered) variant — no localStorage check
function FeatureTourManual({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const config = TOURS[pathname];
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  if (!config) return null;
  const steps = config.steps;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className={cn(
        "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-250",
        visible ? "opacity-100" : "opacity-0"
      )} />
      <div className={cn(
        "relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-250",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
      )} dir="rtl">
        <div className={cn("h-1.5 w-full", config.accent)} />
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0", config.accent)}>
              {config.pageIcon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">جولة تعريفية</p>
              <h3 className="text-base font-black text-text-primary">{config.pageTitle}</h3>
            </div>
          </div>
          <button onClick={close} className="p-1.5 rounded-xl hover:bg-muted text-text-muted transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="mx-6 mb-5">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-400", config.accent)} style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={cn("w-2 h-2 rounded-full transition-all duration-200",
                  i === step ? cn("scale-125", config.accent) : i < step ? "bg-gray-300" : "bg-gray-200")} />
            ))}
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md", config.accent)}>{current.icon}</div>
              <span className="text-[10px] font-bold text-text-muted">{step + 1}/{steps.length}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-primary text-sm mb-1.5">{current.title}</h4>
              <p className="text-sm text-text-secondary leading-relaxed">{current.description}</p>
              {current.tip && (
                <div className="mt-3 flex items-start gap-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-3 py-2">
                  <span className="text-brand-yellow text-base shrink-0">💡</span>
                  <p className="text-xs text-text-secondary leading-relaxed">{current.tip}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-gray-50/50">
          <button onClick={close} className="text-xs text-text-muted hover:text-text-secondary transition-colors font-medium">إغلاق</button>
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                step === 0 ? "opacity-30 cursor-not-allowed border-border-default text-text-muted" : "border-border-default text-text-secondary hover:bg-muted")}>
              <ChevronRight className="w-3.5 h-3.5" />السابق
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm", config.accent, "hover:opacity-90")}>
                التالي<ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button onClick={close}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm", config.accent, "hover:opacity-90")}>
                <CheckCircle2 className="w-3.5 h-3.5" />فهمت!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
