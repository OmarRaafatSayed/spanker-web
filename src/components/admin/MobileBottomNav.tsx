'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  MoreHorizontal,
  Map,
} from 'lucide-react';
import { useState } from 'react';

const PRIMARY_LINKS = [
  { href: '/admin',           icon: LayoutDashboard, label: 'الرئيسية' },
  { href: '/admin/bookings',  icon: Package,         label: 'الحجوزات' },
  { href: '/admin/packages',  icon: Map,             label: 'الرحلات' },
  { href: '/admin/documents', icon: FileText,        label: 'المستندات' },
  { href: '/admin/analytics', icon: BarChart3,       label: 'التحليلات' },
];

const MORE_LINKS = [
  { href: '/admin/hotels',        label: 'الفنادق' },
  { href: '/admin/leads',         label: 'العملاء' },
  { href: '/admin/offers',        label: 'العروض' },
  { href: '/admin/workflows',     label: 'سير العمل' },
  { href: '/admin/visas',         label: 'التأشيرات' },
  { href: '/admin/my-assignments',label: 'حجوزاتي' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
  }

  const isMoreActive = MORE_LINKS.some(l => isActive(l.href));

  return (
    <>
      {/* Bottom nav bar — lg:hidden keeps it mobile-only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border-light safe-area-pb">
        <div className="flex items-stretch h-16">
          {PRIMARY_LINKS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
                onClick={() => setMoreOpen(false)}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? 'text-brand-green' : 'text-text-muted'
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span
                  className={`text-[10px] font-medium leading-none ${
                    active ? 'text-brand-green' : 'text-text-muted'
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute top-0 inset-x-0 h-0.5 bg-brand-green rounded-b" />
                )}
              </Link>
            );
          })}

          {/* "More" button */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors relative"
          >
            <MoreHorizontal
              className={`h-5 w-5 ${isMoreActive || moreOpen ? 'text-brand-green' : 'text-text-muted'}`}
              strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8}
            />
            <span className={`text-[10px] font-medium leading-none ${isMoreActive || moreOpen ? 'text-brand-green' : 'text-text-muted'}`}>
              المزيد
            </span>
            {(isMoreActive || moreOpen) && (
              <span className="absolute top-0 inset-x-0 h-0.5 bg-brand-green rounded-b" />
            )}
          </button>
        </div>
      </nav>

      {/* "More" sheet — slides up */}
      {moreOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30"
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="lg:hidden fixed bottom-16 inset-x-0 z-50 bg-white border-t border-border-light rounded-t-2xl shadow-xl p-4 pb-6">
            <div className="mx-auto w-10 h-1 bg-muted rounded-full mb-4" />
            <p className="text-xs font-semibold text-text-muted mb-3 px-1">صفحات إضافية</p>
            <div className="grid grid-cols-3 gap-2">
              {MORE_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-green/10 text-brand-green'
                        : 'bg-muted/60 text-text-secondary hover:bg-muted'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Spacer so page content isn't hidden behind the bar */}
      <div className="lg:hidden h-16" aria-hidden="true" />
    </>
  );
}
