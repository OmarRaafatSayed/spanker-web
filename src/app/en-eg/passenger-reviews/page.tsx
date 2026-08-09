"use client";

import { useState, useMemo } from "react";
import { REVIEWS, REVIEW_STATS, type Review } from "@/data/reviews";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

/* ─── Star component ─────────────────────────────────── */
function Stars({
  rating,
  size = 16,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={s <= rating ? "#FDD12A" : "none"}
          stroke={s <= rating ? "#FDD12A" : "#d1d5db"}
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

/* ─── Aspect bar ─────────────────────────────────────── */
function AspectBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-700"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-text-primary w-6 text-end">{value}</span>
    </div>
  );
}

/* ─── Review Card ────────────────────────────────────── */
function ReviewCard({ review, locale }: { review: Review; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const [expanded, setExpanded] = useState(false);

  const body = isAr ? review.body.ar : review.body.en;
  const name = isAr ? review.name.ar : review.name.en;
  const country = isAr ? review.country.ar : review.country.en;
  const route = isAr ? review.route.ar : review.route.en;
  const title = isAr ? review.title.ar : review.title.en;
  const date = isAr ? review.date.ar : review.date.en;
  const tags = isAr ? review.tags.ar : review.tags.en;

  const ASPECTS = isAr
    ? { seat: "المقعد", food: "الطعام", crew: "الطاقم", entertainment: "الترفيه", value: "القيمة" }
    : { seat: "Seat", food: "Food", crew: "Crew", entertainment: "Entertainment", value: "Value" };

  const needsExpand = body.length > 200;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-border-light p-5 sm:p-6 hover:shadow-md transition-shadow duration-300 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: review.avatarColor }}
          >
            {review.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-text-primary">{name}</span>
              <span className="text-base">{review.flag}</span>
            </div>
            <span className="text-xs text-text-secondary">{country}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Stars rating={review.rating} size={14} />
          <span className="text-xs text-text-secondary">{date}</span>
        </div>
      </div>

      {/* Route badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 bg-brand-green/10 text-brand-green text-xs font-medium px-2.5 py-1 rounded-full">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          {route}
        </span>
        <span className="text-xs text-text-secondary bg-bg-alt px-2 py-0.5 rounded-full">
          {review.flightNumber}
        </span>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            review.cabinClass === "business"
              ? "bg-brand-yellow/20 text-yellow-700"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {review.cabinClass === "business"
            ? isAr ? "درجة أعمال" : "Business"
            : isAr ? "اقتصادية" : "Economy"}
        </span>
        {review.verified && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {isAr ? "رحلة موثقة" : "Verified trip"}
          </span>
        )}
      </div>

      {/* Review title & body */}
      <div>
        <h3 className={cn("font-semibold text-text-primary mb-1.5", isAr ? "text-right" : "text-left")}>
          {title}
        </h3>
        <p
          className={cn(
            "text-sm text-text-secondary leading-relaxed",
            isAr ? "text-right" : "text-left",
            !expanded && needsExpand && "line-clamp-3"
          )}
        >
          {body}
        </p>
        {needsExpand && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-brand-green font-medium mt-1 hover:underline"
          >
            {expanded
              ? isAr ? "أقل" : "Show less"
              : isAr ? "اقرأ المزيد" : "Read more"}
          </button>
        )}
      </div>

      {/* Tags */}
      <div className={cn("flex flex-wrap gap-1.5", isAr ? "flex-row-reverse" : "")}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-bg-alt text-text-secondary px-2.5 py-0.5 rounded-full border border-border-light"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Aspects */}
      <div className="border-t border-border-light pt-4 flex flex-col gap-2">
        {(Object.keys(review.aspects) as Array<keyof typeof review.aspects>).map((key) => (
          <AspectBar key={key} label={ASPECTS[key]} value={review.aspects[key]} />
        ))}
      </div>

      {/* Helpful */}
      <div className={cn("flex items-center gap-2 text-xs text-text-secondary", isAr ? "flex-row-reverse" : "")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
        <span>
          {isAr
            ? `${review.helpful} شخص وجد هذا المراجعة مفيدة`
            : `${review.helpful} people found this helpful`}
        </span>
      </div>
    </article>
  );
}

/* ─── Main Page ──────────────────────────────────────── */
type FilterRating = "all" | 5 | 4 | 3 | 2 | 1;
type FilterCabin = "all" | "economy" | "business";
type SortBy = "newest" | "highest" | "lowest" | "helpful";

export default function PassengerReviewsPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  const [filterRating, setFilterRating] = useState<FilterRating>("all");
  const [filterCabin, setFilterCabin] = useState<FilterCabin>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let list = [...REVIEWS];
    if (filterRating !== "all") list = list.filter((r) => r.rating === filterRating);
    if (filterCabin !== "all") list = list.filter((r) => r.cabinClass === filterCabin);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.ar.toLowerCase().includes(q) ||
          r.name.en.toLowerCase().includes(q) ||
          r.route.ar.includes(q) ||
          r.route.en.toLowerCase().includes(q) ||
          r.title.ar.includes(q) ||
          r.title.en.toLowerCase().includes(q) ||
          r.body.ar.includes(q) ||
          r.body.en.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "highest":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "lowest":
        list.sort((a, b) => a.rating - b.rating);
        break;
      case "helpful":
        list.sort((a, b) => b.helpful - a.helpful);
        break;
      default:
        // newest: keep original order (already sorted by id/date)
        break;
    }
    return list;
  }, [filterRating, filterCabin, sortBy, searchQuery]);

  const stats = REVIEW_STATS;
  const ASPECTS_LABELS = isAr
    ? { seat: "المقعد", food: "الطعام", crew: "الطاقم", entertainment: "الترفيه", value: "القيمة" }
    : { seat: "Seat", food: "Food", crew: "Crew", entertainment: "Entertainment", value: "Value" };

  return (
    <>
      <Navbar />
      <main className={cn("min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero banner */}
      <section className="bg-brand-green text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {isAr ? "آراء المسافرين" : "Passenger Reviews"}
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
            {isAr
              ? "تجارب حقيقية من مسافرين حقيقيين — اكتشف ما يقوله ركابنا عن رحلاتهم مع سبانكر"
              : "Real experiences from real travelers — discover what our passengers say about flying with Spanker"}
          </p>

          {/* Overall rating hero */}
          <div className="mt-8 inline-flex items-center gap-4 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
            <div className="text-center">
              <div className="text-5xl font-extrabold">{stats.averageRating}</div>
              <Stars rating={Math.round(stats.averageRating)} size={20} className="mt-1" />
              <div className="text-sm text-white/80 mt-1">
                {isAr ? `من ${stats.totalReviews} مراجعة` : `from ${stats.totalReviews} reviews`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1 flex flex-col gap-6">
            {/* Rating breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-border-light p-5">
              <h2 className="font-semibold text-text-primary mb-4">
                {isAr ? "توزيع التقييمات" : "Rating Breakdown"}
              </h2>
              <div className="flex flex-col gap-2">
                {stats.ratingBreakdown.map(({ star, count, percentage }) => (
                  <button
                    key={star}
                    onClick={() => setFilterRating(filterRating === star ? "all" : (star as FilterRating))}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 w-full transition-colors text-sm",
                      filterRating === star ? "bg-brand-green/10" : "hover:bg-bg-alt"
                    )}
                  >
                    <Stars rating={star} size={12} />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-brand-yellow rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-text-secondary w-5 text-end">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Average aspects */}
            <div className="bg-white rounded-2xl shadow-sm border border-border-light p-5">
              <h2 className="font-semibold text-text-primary mb-4">
                {isAr ? "متوسط التقييم" : "Aspect Averages"}
              </h2>
              <div className="flex flex-col gap-3">
                {(Object.keys(stats.averageAspects) as Array<keyof typeof stats.averageAspects>).map((key) => (
                  <AspectBar
                    key={key}
                    label={ASPECTS_LABELS[key]}
                    value={stats.averageAspects[key]}
                  />
                ))}
              </div>
            </div>

            {/* Cabin filter */}
            <div className="bg-white rounded-2xl shadow-sm border border-border-light p-5">
              <h2 className="font-semibold text-text-primary mb-3">
                {isAr ? "درجة الكابينة" : "Cabin Class"}
              </h2>
              <div className="flex flex-col gap-2">
                {(["all", "economy", "business"] as FilterCabin[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCabin(c)}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-lg w-full text-start transition-colors",
                      filterCabin === c
                        ? "bg-brand-green text-white"
                        : "hover:bg-bg-alt text-text-secondary"
                    )}
                  >
                    {c === "all"
                      ? isAr ? "الكل" : "All"
                      : c === "economy"
                      ? isAr ? "اقتصادية" : "Economy"
                      : isAr ? "درجة أعمال" : "Business"}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main Reviews ── */}
          <section className="lg:col-span-3 flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg
                  className={cn("absolute top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none", isRTL ? "right-3" : "left-3")}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  placeholder={isAr ? "ابحث في المراجعات..." : "Search reviews..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full border border-border-light rounded-xl py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green",
                    isRTL ? "pr-9 pl-4 text-right" : "pl-9 pr-4"
                  )}
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className={cn(
                  "border border-border-light rounded-xl py-2.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30",
                  isRTL ? "text-right" : ""
                )}
              >
                <option value="newest">{isAr ? "الأحدث" : "Newest"}</option>
                <option value="highest">{isAr ? "الأعلى تقييماً" : "Highest rated"}</option>
                <option value="lowest">{isAr ? "الأقل تقييماً" : "Lowest rated"}</option>
                <option value="helpful">{isAr ? "الأكثر فائدة" : "Most helpful"}</option>
              </select>
            </div>

            {/* Results count */}
            <p className={cn("text-sm text-text-secondary", isRTL ? "text-right" : "")}>
              {isAr
                ? `يعرض ${filtered.length} من ${stats.totalReviews} مراجعة`
                : `Showing ${filtered.length} of ${stats.totalReviews} reviews`}
            </p>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-text-secondary">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {isAr ? "لا توجد مراجعات تطابق بحثك" : "No reviews match your search"}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((r) => (
                  <ReviewCard key={r.id} review={r} locale={locale} />
                ))}
              </div>
            )}

            {/* CTA write review */}
            <div className="mt-4 bg-brand-green/5 border border-brand-green/20 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-text-primary mb-2">
                {isAr ? "سافرت معنا مؤخراً؟" : "Flew with us recently?"}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {isAr
                  ? "شاركنا تجربتك وساعد المسافرين الآخرين على اتخاذ قراراتهم"
                  : "Share your experience and help other travelers make their decisions"}
              </p>
              <button className="bg-brand-green text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-green/90 transition-colors">
                {isAr ? "اكتب مراجعتك" : "Write a Review"}
              </button>
            </div>
          </section>
        </div>
      </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
