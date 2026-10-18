'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  Settings,
  CheckCircle2,
  Command,
  Keyboard,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'admin_onboarding_dismissed';

const QUICK_START = [
  {
    icon: <Package className="h-6 w-6" />,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    title: 'راجع الحجوزات',
    desc: 'شوف كل الطلبات الجديدة وأكّد أو ألغي',
    href: '/admin/bookings?status=pending',
    cta: 'عرض المعلّقة',
  },
  {
    icon: <FileText className="h-6 w-6" />,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    title: 'وافق على المستندات',
    desc: 'مستندات العملاء في انتظار مراجعتك',
    href: '/admin/documents',
    cta: 'فتح المستندات',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'bg-green-50 text-green-600 border-green-200',
    title: 'تحليلات الفريق',
    desc: 'شوف أداء كل موظف والإيرادات',
    href: '/admin/analytics',
    cta: 'عرض التحليلات',
  },
  {
    icon: <Settings className="h-6 w-6" />,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    title: 'اضبط الأتمتة',
    desc: 'فعّل الإشعارات التلقائية وانتهاء الصلاحية',
    href: '/admin/workflows',
    cta: 'سير العمل',
  },
];

const TIPS = [
  { icon: <Command className="h-4 w-4" />, text: 'اضغط Ctrl+K في أي وقت لفتح قائمة الأوامر السريعة' },
  { icon: <Keyboard className="h-4 w-4" />, text: 'اضغط ? لعرض كل اختصارات لوحة المفاتيح' },
  { icon: <CheckCircle2 className="h-4 w-4" />, text: 'حدد أكثر من حجز بالـ checkbox وقم بعمليات جماعية' },
];

export function AdminOnboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep]       = useState<'welcome' | 'tips'>('welcome');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/5 to-white overflow-hidden shadow-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-green/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green text-white shrink-0">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-text-primary text-base leading-tight">
              مرحباً بك في لوحة الإدارة 👋
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              إليك أهم الأشياء لتبدأ بسرعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Step toggle */}
          <div className="hidden sm:flex rounded-lg border border-border-default overflow-hidden text-xs">
            <button
              onClick={() => setStep('welcome')}
              className={`px-3 py-1.5 transition-colors ${
                step === 'welcome' ? 'bg-brand-green text-white' : 'text-text-secondary hover:bg-muted'
              }`}
            >
              البداية
            </button>
            <button
              onClick={() => setStep('tips')}
              className={`px-3 py-1.5 transition-colors ${
                step === 'tips' ? 'bg-brand-green text-white' : 'text-text-secondary hover:bg-muted'
              }`}
            >
              نصائح سريعة
            </button>
          </div>

          <button
            onClick={dismiss}
            className="p-1.5 rounded-lg text-text-muted hover:bg-muted hover:text-text-primary transition-colors"
            title="إغلاق ولن يظهر مجدداً"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {step === 'welcome' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_START.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className={`group flex flex-col gap-3 p-4 rounded-xl border-2 ${card.color} hover:shadow-md transition-all hover:-translate-y-0.5`}
                >
                  <div className="flex items-start justify-between">
                    {card.icon}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{card.title}</p>
                    <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{card.desc}</p>
                  </div>
                  <span className="text-xs font-medium underline underline-offset-2 opacity-80">
                    {card.cta} ←
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setStep('tips')}
                className="text-xs text-brand-green hover:underline"
              >
                شوف نصائح سريعة ←
              </button>
              <button
                onClick={dismiss}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                إخفاء هذه الرسالة نهائياً
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white border border-border-default"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green shrink-0">
                    {tip.icon}
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setStep('welcome')}
                className="text-xs text-brand-green hover:underline"
              >
                → العودة للبداية
              </button>
              <button
                onClick={dismiss}
                className="text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                إخفاء هذه الرسالة نهائياً
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
