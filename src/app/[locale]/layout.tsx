import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/modules/auth";

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#3D6833",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://spanker.travel"),
  title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
  description:
    "سبانكر — احجز رحلاتك إلى مصر وما بعدها. عروض خاصة على رحلات مرسى علم، الغردقة، شرم الشيخ، الأقصر، أسوان وأكثر.",
  icons: {
    icon: [
      { url: "/icone-LOGO.png", type: "image/png" },
      { url: "/icone-LOGO.png", sizes: "32x32", type: "image/png" },
      { url: "/icone-LOGO.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/icone-LOGO.png",
    shortcut: "/icone-LOGO.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
    description: "احجز رحلاتك إلى مصر وما بعدها مع سبانكر",
    images: ["/width-logo.png"],
    type: "website",
    siteName: "Spanker Travel",
  },
  twitter: {
    card: "summary_large_image",
    title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
    description: "احجز رحلاتك إلى مصر وما بعدها مع سبانكر",
    images: ["/width-logo.png"],
  },
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await params (Next.js 15+ async params)
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "ar" | "en")) {
    notFound();
  }

  // Load messages for the current locale
  const messages = await getMessages();

  // Determine direction
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden w-full max-w-full">
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/*
           * I18nProvider kept for backward-compat with existing components
           * that still use useI18n() — gradually migrate them to useTranslations()
           */}
          <I18nProvider initialLocale={locale as "ar" | "en"}>
            <AuthProvider>{children}</AuthProvider>
          </I18nProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
