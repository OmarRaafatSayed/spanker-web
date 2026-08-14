import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const cairo = Cairo({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سبانكر - طر أينما تريد | Spanker - Fly Wherever You Want",
  description:
    "سبانكر — احجز رحلاتك إلى مصر وما بعدها. عروض خاصة على رحلات مرسى علم، الغردقة، شرم الشيخ، الأقصر، أسوان وأكثر.",
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
  themeColor: '#3D6833',
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
    // lang and dir are managed dynamically by I18nProvider via useEffect
    // We set the default (Arabic/RTL) here as the initial HTML attribute
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <I18nProvider><AuthProvider>{children}</AuthProvider></I18nProvider>
      </body>
    </html>
  );
}
