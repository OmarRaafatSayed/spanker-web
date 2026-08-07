"use client";

import { useI18n } from "@/lib/i18n/context";

export function MobileAppBanner() {
  const { t } = useI18n();
  const s = t.app;

  return (
    <section className="bg-brand-dark py-16 md:py-20 overflow-hidden" aria-labelledby="app-banner-title">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text + CTA */}
          <div className="flex-1 text-center lg:text-start">
            <p className="text-brand-red font-semibold text-sm uppercase tracking-widest mb-4">
              {s.label}
            </p>
            <h2 id="app-banner-title" className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
              {s.title}{" "}
              <span className="text-brand-red">{s.titleHighlight}</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              {s.description}
            </p>

            {/* App Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a href="#" aria-label={`${s.appStore} ${s.appStoreName}`} className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors">
                <svg width="24" height="28" viewBox="0 0 24 28" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M17.05 14.8c-.03-3.2 2.62-4.74 2.73-4.82-1.5-2.19-3.82-2.48-4.64-2.51-1.96-.2-3.86 1.16-4.86 1.16s-2.55-1.14-4.2-1.11c-2.14.03-4.14 1.26-5.25 3.17-2.27 3.92-.58 9.72 1.6 12.9 1.09 1.56 2.36 3.3 4.03 3.24 1.63-.07 2.24-1.04 4.2-1.04 1.96 0 2.53 1.04 4.24 1 1.74-.03 2.84-1.57 3.9-3.15 1.23-1.8 1.73-3.55 1.76-3.64-.04-.02-3.37-1.29-3.41-5.2z" />
                  <path d="M14.03 5.18c.9-1.09 1.5-2.61 1.34-4.12-1.3.05-2.86.86-3.79 1.95-.83.96-1.56 2.49-1.37 3.96 1.45.11 2.92-.73 3.82-1.79z" />
                </svg>
                <div className="text-start">
                  <p className="text-white/60 text-xs">{s.appStore}</p>
                  <p className="text-white font-semibold text-sm">{s.appStoreName}</p>
                </div>
              </a>

              <a href="#" aria-label={`${s.googlePlay} ${s.googlePlayName}`} className="flex items-center gap-3 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors">
                <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1.22 0.6C0.9 0.93 0.72 1.42 0.72 2.03V24.0C0.72 24.61 0.9 25.1 1.22 25.43L1.3 25.5L13.56 13.24V12.79L1.3 0.53L1.22 0.6Z" fill="url(#g1)" />
                  <path d="M17.6 17.3L13.56 13.24V12.79L17.61 8.74L17.7 8.8L22.5 11.57C23.87 12.33 23.87 13.7 22.5 14.46L17.7 17.24L17.6 17.3Z" fill="url(#g2)" />
                  <path d="M17.7 17.24L13.56 13.02L1.22 25.43C1.68 25.93 2.43 25.99 3.28 25.51L17.7 17.24Z" fill="url(#g3)" />
                  <path d="M17.7 8.8L3.28 0.53C2.43 0.04 1.68 0.11 1.22 0.6L13.56 13.02L17.7 8.8Z" fill="url(#g4)" />
                  <defs>
                    <linearGradient id="g1" x1="12.8" y1="1.27" x2="-4.8" y2="13.02" gradientUnits="userSpaceOnUse"><stop stopColor="#00A0FF" /><stop offset="1" stopColor="#00AFFF" /></linearGradient>
                    <linearGradient id="g2" x1="23.83" y1="13.02" x2="0.5" y2="13.02" gradientUnits="userSpaceOnUse"><stop stopColor="#FFD900" /><stop offset="1" stopColor="#FFBD00" /></linearGradient>
                    <linearGradient id="g3" x1="15.34" y1="15.68" x2="-5.63" y2="36.92" gradientUnits="userSpaceOnUse"><stop stopColor="#FF3A44" /><stop offset="1" stopColor="#C31162" /></linearGradient>
                    <linearGradient id="g4" x1="-1.66" y1="-7.91" x2="8.42" y2="2.25" gradientUnits="userSpaceOnUse"><stop stopColor="#32A071" /><stop offset="1" stopColor="#2DA771" /></linearGradient>
                  </defs>
                </svg>
                <div className="text-start">
                  <p className="text-white/60 text-xs">{s.googlePlay}</p>
                  <p className="text-white font-semibold text-sm">{s.googlePlayName}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex-none flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-20 bg-brand-red" aria-hidden="true" />
              <div className="relative w-56 h-115 bg-[#0D1A0D] rounded-[3rem] border-4 border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0D1A0D] rounded-full z-10 border-2 border-white/5" />
                <div className="w-full h-full bg-linear-to-b from-brand-dark to-[#0D1A0D] flex flex-col pt-12 px-4 pb-4">
                  <div className="flex justify-between items-center mb-6 opacity-60">
                    <span className="text-white text-[10px] font-medium">9:41</span>
                    <div className="w-4 h-2 border border-white/60 rounded-sm"><div className="w-3/4 h-full bg-white/60 rounded-sm" /></div>
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-bold">{t.app.titleHighlight}</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 mb-3">
                    <p className="text-white/50 text-[10px] mb-1 uppercase tracking-wide">{t.search.from}</p>
                    <p className="text-white text-sm font-semibold">Cairo (CAI)</p>
                    <div className="border-t border-white/10 my-2" />
                    <p className="text-white/50 text-[10px] mb-1 uppercase tracking-wide">{t.search.to}</p>
                    <p className="text-white text-sm font-semibold">Marsa Alam (RMF)</p>
                  </div>
                  <div className="bg-brand-red rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="text-white/70 text-[10px]">{t.search.departure}</p><p className="text-white text-sm font-bold">08:30</p></div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      <div className="text-end"><p className="text-white/70 text-[10px]">{t.search.return}</p><p className="text-white text-sm font-bold">10:15</p></div>
                    </div>
                    <p className="text-white/70 text-[10px] text-center">1h 45m · Direct</p>
                  </div>
                  <div className="mt-auto flex justify-around pt-3 border-t border-white/10">
                    {["🏠", "✈️", "🎫", "👤"].map((icon, i) => (
                      <span key={i} className="text-base">{icon}</span>
                    ))}
                  </div>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
