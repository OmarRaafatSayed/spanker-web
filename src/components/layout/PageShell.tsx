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
  /** Unique snake_case key — used by the dashboard to identify the page */
  pageId: string;
  /** Section label shown above the title (e.g. "سبانكر") */
  section?: string;
  /** Main H1 title */
  title: string;
  /** Subtitle / description line */
  subtitle?: string;
  /** Breadcrumb trail. If omitted the shell auto-generates Home → title */
  breadcrumbs?: BreadcrumbItem[];
  /** Constrain inner content width. Defaults to "lg" */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

// ─── Width map ────────────────────────────────────────────────────────────────

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
                <Link
                  href={item.href}
                  className="hover:text-brand-red transition-colors"
                >
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

// ─── Inner page header (reusable standalone) ──────────────────────────────────

export function InnerPageHeader({
  section,
  title,
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
    <div
      className={cn(
        "mx-auto px-4 lg:px-8 py-10",
        WIDTH_CLASS[maxWidth ?? "lg"],
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps extends PageMeta {
  children: React.ReactNode;
  /** Extra classes on <main> */
  className?: string;
}

/**
 * Unified wrapper for all secondary / inner pages.
 *
 * Usage:
 * ```tsx
 * <PageShell pageId="about" section="سبانكر" title="عن سبانكر" subtitle="نحن نطير بك..." maxWidth="lg">
 *   {content}
 * </PageShell>
 * ```
 *
 * The `pageId` is exposed as a `data-page-id` attribute on <main>
 * so the future dashboard can target/highlight the page.
 */
export function PageShell({
  pageId,
  section,
  title,
  subtitle,
  breadcrumbs,
  maxWidth = "lg",
  children,
  className,
}: PageShellProps) {
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
