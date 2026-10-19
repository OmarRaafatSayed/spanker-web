"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const OFFER_TYPES = ["الكل", "طيران", "فنادق", "تأشيرات", "باقات"];

const TYPE_FILTER_MAP: Record<string, string> = {
  "طيران":   "flight",
  "فنادق":   "hotel",
  "تأشيرات": "visa",
  "باقات":   "package",
};

const VERTICAL_HREF: Record<string, string> = {
  "package": "tours",
  "flight":  "book-flight",
  "hotel":   "hotel-booking",
  "visa":    "visa-application",
};

export default function SpecialOffersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const [activeType, setActiveType] = useState("الكل");
  const [offers, setOffers]         = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/admin/special-offers?active=true")
      .then(r => r.json())
      .then(j => { if (j.success) setOffers(j.data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = offers.filter(o => {
    if (activeType === "الكل") return true;
    const meta = o.meta as Record<string, unknown> ?? {};
    return meta.offer_type === TYPE_FILTER_MAP[activeType];
  });

  return (
    <PageShell
      pageId="special-offers"
      title="العروض والوجهات"
      subtitle="أفضل الأسعار على رحلات الطيران والفنادق والرحلات السياحية"
      maxWidth="xl"
    >
      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {OFFER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-all ${
              activeType === type
                ? "bg-brand-green text-white border-brand-green"
                : "border-border-default text-text-secondary hover:border-brand-green/40"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl border border-border-light overflow-hidden animate-pulse">
              <div className="h-40 bg-muted" />
              <div className="p-5 space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-semibold">لا توجد عروض متاحة حالياً</p>
          <p className="text-sm mt-1">تابعنا قريباً لعروض حصرية</p>
        </div>
      )}

      {/* Offers grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((offer) => {
            const meta = (offer.meta as Record<string, unknown>) ?? {};
            const includes = Array.isArray(meta.includes) ? (meta.includes as string[]) : [];
            const vertical = VERTICAL_HREF[(meta.offer_type as string) ?? "package"] ?? "book-flight";

            return (
              <div
                key={offer.id as string}
                className="bg-white rounded-2xl border border-border-light overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                {/* Hero */}
                <div className="relative h-40 bg-gradient-to-br from-brand-green to-brand-green-dark flex items-center justify-center overflow-hidden">
                  {offer.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={offer.image_url as string}
                      alt={offer.title as string}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl">{(meta.emoji as string) ?? "🌟"}</span>
                  )}
                  {meta.badge && (
                    <div className={`absolute top-3 right-3 text-xs text-white font-bold px-2.5 py-1 rounded-full ${(meta.badge_color as string) ?? "bg-brand-green"}`}>
                      {meta.badge as string}
                    </div>
                  )}
                  {meta.discount_percent && (
                    <div className="absolute top-3 left-3 bg-white text-brand-green font-black text-sm px-2 py-0.5 rounded-full">
                      -{meta.discount_percent as number}٪
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-xs text-text-muted mb-1">
                    {(meta.destination as string) ?? "—"}
                    {meta.duration ? ` • ${meta.duration as string}` : ""}
                  </p>
                  <h3 className="font-bold text-text-primary mb-3">{offer.title as string}</h3>

                  {/* Includes */}
                  {includes.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {includes.slice(0, 4).map((item, i) => (
                        <p key={i} className="text-xs text-text-secondary">{item}</p>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      {meta.original_price && (
                        <p className="text-xs text-text-muted line-through">
                          {Number(meta.original_price).toLocaleString()} {(meta.currency as string) ?? "ج.م"}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-brand-green">
                        {Number(meta.discounted_price ?? 0).toLocaleString()} {(meta.currency as string) ?? "ج.م"}
                      </p>
                    </div>
                    {offer.end_date && (
                      <p className="text-xs text-text-muted text-left">
                        ينتهي<br />
                        {new Date(offer.end_date as string).toLocaleDateString("ar-EG", {
                          day: "2-digit", month: "short",
                        })}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/${locale}/${vertical}`}
                    className="block w-full text-center py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition-colors"
                  >
                    احجز الآن
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
