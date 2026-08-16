"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageMeta {
  pageId: string;
  section?: string;
  /** Required for light-theme pages. For dark hero pages, heroTitle is used instead. */
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  /** Dark hero with icon — used by the new en-eg pages */
  heroTitle?: string;
  heroSubtitle?: string;
  heroIcon?: React.ReactNode;
  /** If true, renders the dark-theme hero instead of the light InnerPageHeader */
  darkHero?: boolean;
}

const WIDTH_CLASS: Record<NonNullable<PageMeta["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-7xl",
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-text-muted">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true" className="text-text-muted/50">/</span>}
              {isLast || !item.href ? (
                <span className={cn(isLast ? "text-text-secondary font-medium" : "")}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand-red transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Light inner page header ──────────────────────────────────────────────────

export function InnerPageHeader({
  section,
  title = "",
  subtitle,
  breadcrumbs,
}: Pick<PageMeta, "section" | "title" | "subtitle" | "breadcrumbs">) {
  const crumbs: BreadcrumbItem[] = breadcrumbs ?? [
    { label: "الرئيسية", href: "/" },
    { label: title },
  ];

  return (
    <div className="mb-10 border-b border-border-light pb-6">
      <Breadcrumb items={crumbs} />
      {section && (
        <p className="text-brand-red text-xs font-semibold uppercase tracking-widest mb-2">
          {section}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">{title}</h1>
      {subtitle && (
        <p className="text-text-secondary text-base md:text-lg">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Dark hero header (used by en-eg pages) ───────────────────────────────────

export function DarkPageHero({
  heroTitle,
  heroSubtitle,
  heroIcon,
}: {
  heroTitle: string;
  heroSubtitle?: string;
  heroIcon?: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-[#1a3a1f] to-[#0f1a0b] py-14 px-4 text-center border-b border-white/10">
      {heroIcon && (
        <div className="w-14 h-14 rounded-2xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4 text-brand-green">
          {heroIcon}
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{heroTitle}</h1>
      {heroSubtitle && (
        <p className="text-white/55 text-base max-w-xl mx-auto">{heroSubtitle}</p>
      )}
    </div>
  );
}

// ─── Content width wrapper ────────────────────────────────────────────────────

export function InnerPageContent({
  children,
  maxWidth = "lg",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: PageMeta["maxWidth"];
  className?: string;
}) {
  return (
    <div className={cn("mx-auto px-4 lg:px-8 py-10", WIDTH_CLASS[maxWidth ?? "lg"], className)}>
      {children}
    </div>
  );
}

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps extends PageMeta {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  pageId,
  section,
  title,
  subtitle,
  breadcrumbs,
  maxWidth = "lg",
  heroTitle,
  heroSubtitle,
  heroIcon,
  darkHero = false,
  children,
  className,
}: PageShellProps) {
  const isDark = darkHero || !!heroTitle;

  if (isDark) {
    return (
      <>
        <Navbar />
        <main
          data-page-id={pageId}
          className={cn("min-h-screen bg-[#0f1a0b] pt-16 pb-20 lg:pb-0", className)}
        >
          <DarkPageHero
            heroTitle={heroTitle ?? title ?? ""}
            heroSubtitle={heroSubtitle ?? subtitle}
            heroIcon={heroIcon}
          />
          <div className={cn("mx-auto px-4 py-12", WIDTH_CLASS[maxWidth ?? "xl"])}>
            {children}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        data-page-id={pageId}
        className={cn("pt-20 pb-20 lg:pb-0 min-h-screen", className)}
      >
        <InnerPageContent maxWidth={maxWidth}>
          <InnerPageHeader
            section={section}
            title={title}
            subtitle={subtitle}
            breadcrumbs={breadcrumbs}
          />
          {children}
        </InnerPageContent>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
