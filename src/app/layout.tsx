import type { Metadata, Viewport } from "next";
import { Cairo, Playfair_Display, Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  preload: false,
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-jakarta",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#3D6833",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://spanker.travel"),
  title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
  description:
    "سبانكر — احجز رحلاتك إلى مصر وما بعدها. عروض خاصة على رحلات مرسى علم الغردقة شرم الشيخ الأقصر أسوان وأكثر.",
  icons: {
    icon: [
      { url: '/icone-LOGO.png', type: 'image/png' },
      { url: '/icone-LOGO.png', sizes: '32x32', type: 'image/png' },
      { url: '/icone-LOGO.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/icone-LOGO.png',
    shortcut: '/icone-LOGO.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
    description: "احجز رحلاتك إلى مصر وما بعدها مع سبانكر",
    images: ['/width-logo.png'],
    type: 'website',
    locale: 'ar_EG',
    siteName: 'Spanker Travel',
  },
  twitter: {
    card: 'summary_large_image',
    title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
    description: "احجز رحلاتك إلى مصر وما بعدها مع سبانكر",
    images: ['/width-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${playfair.variable} ${bebasNeue.variable} ${plusJakarta.variable} h-full antialiased overflow-x-hidden`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden w-full max-w-full" suppressHydrationWarning>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
