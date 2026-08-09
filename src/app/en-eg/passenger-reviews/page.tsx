"use client";

import { useState } from "react";
import { REVIEWS, type Review } from "@/data/reviews";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

/* ─── Star Rating (display) ──────────────────────────── */
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
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

/* ─── Star Picker (interactive) ─────────────────────── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${s} stars`}
          className="transition-transform hover:scale-110"
        >
          <svg
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill={s <= (hovered || value) ? "#FDD12A" : "none"}
            stroke={s <= (hovered || value) ? "#FDD12A" : "#d1d5db"}
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </span>
  );
}

/* ─── Review Card ────────────────────────────────────── */
function ReviewCard({ review, locale }: { review: Review; locale: "ar" | "en" }) {
  const isAr = locale === "ar";
  const [expanded, setExpanded] = useState(false);

  const body = isAr ? review.body.ar : review.body.en;
  const name = isAr ? review.name.ar : review.name.en;
  const date = isAr ? review.date.ar : review.date.en;

  const needsExpand = body.length > 220;

  return (
    <article className="bg-white rounded-2xl border border-border-light p-5 flex flex-col gap-3">
      {/* Name + rating + date */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm text-text-primary">{name}</p>
          <p className="text-xs text-text-muted mt-0.5">{date}</p>
        </div>
        <Stars rating={review.rating} size={14} />
      </div>

      {/* Body */}
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
          className="text-xs text-brand-red font-medium hover:underline self-start"
        >
          {expanded
            ? isAr ? "أقل" : "Show less"
            : isAr ? "اقرأ المزيد" : "Read more"}
        </button>
      )}
    </article>
  );
}

/* ─── Add Review Form ────────────────────────────────── */
interface NewReview {
  name: string;
  rating: number;
  body: string;
}

function AddReviewForm({
  locale,
  onSubmit,
}: {
  locale: "ar" | "en";
  onSubmit: (r: NewReview) => void;
}) {
  const isAr = locale === "ar";
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError(isAr ? "أدخل اسمك" : "Enter your name"); return; }
    if (rating === 0) { setError(isAr ? "اختر تقييماً" : "Choose a rating"); return; }
    if (body.trim().length < 10) { setError(isAr ? "اكتب مراجعة مختصرة على الأقل" : "Write a short review (min 10 chars)"); return; }
    setError(null);
    onSubmit({ name: name.trim(), rating, body: body.trim() });
    setName("");
    setRating(0);
    setBody("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-border-light p-5 flex flex-col gap-4"
      noValidate
    >
      <h3 className="font-semibold text-text-primary text-base">
        {isAr ? "أضف مراجعتك" : "Add your review"}
      </h3>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {isAr ? "الاسم" : "Name"}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isAr ? "اسمك الكريم" : "Your name"}
          className={cn(
            "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition",
            isAr ? "text-right" : ""
          )}
        />
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2">
          {isAr ? "التقييم" : "Rating"}
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">
          {isAr ? "تجربتك" : "Your experience"}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder={isAr ? "شاركنا تجربتك مع سبانكر..." : "Share your experience with Spanker..."}
          className={cn(
            "w-full px-3 py-2.5 border border-border-light rounded-lg text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition resize-none",
            isAr ? "text-right" : ""
          )}
        />
      </div>

      <button
        type="submit"
        className="self-start px-6 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-full hover:bg-brand-red-dark transition-colors"
      >
        {isAr ? "نشر المراجعة" : "Post review"}
      </button>
    </form>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function PassengerReviewsPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  // Local state — seed with static data, user additions go on top
  const [reviews, setReviews] = useState<Review[]>([...REVIEWS]);

  function handleNewReview({ name, rating, body }: NewReview) {
    const now = new Date();
    const dateAr = now.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });
    const dateEn = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const newReview: Review = {
      id: `user-${Date.now()}`,
      name: { ar: name, en: name },
      rating,
      date: { ar: dateAr, en: dateEn },
      body: { ar: body, en: body },
      // filler fields to satisfy the Review type
      country: { ar: "", en: "" },
      route: { ar: "", en: "" },
      title: { ar: "", en: "" },
      tags: { ar: [], en: [] },
      flightNumber: "",
      cabinClass: "economy",
      verified: false,
      helpful: 0,
      avatar: name.slice(0, 2).toUpperCase(),
      avatarColor: "#3D6833",
      flag: "",
      aspects: { seat: rating, food: rating, crew: rating, entertainment: rating, value: rating },
    };

    setReviews((prev) => [newReview, ...prev]);
  }

  return (
    <>
      <Navbar />
      <main
        className={cn("min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0")}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "آراء المسافرين" : "Passenger Reviews"}
            </h1>
            <p className="text-white/80 text-base">
              {isAr
                ? "تجارب حقيقية من مسافرين حقيقيين"
                : "Real experiences from real travelers"}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {isAr ? `${reviews.length} مراجعة` : `${reviews.length} reviews`}
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
          {/* Add review form */}
          <AddReviewForm locale={locale} onSubmit={handleNewReview} />

          {/* Reviews list */}
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} locale={locale} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
