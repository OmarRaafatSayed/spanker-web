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
