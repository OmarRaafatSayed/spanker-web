import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "مكاتب التواصل | Office Contacts — Spanker",
  description: "أرقام التواصل ومواقع مكاتب سبانكر في مصر والخارج.",
};

const QUICK_CONTACTS = [
  { icon: "📞", label: "خط العملاء", value: "19970", sub: "24/7" },
  { icon: "💬", label: "واتساب", value: "+20 100 123 4567", sub: "رد خلال ساعة" },
  { icon: "📧", label: "البريد الإلكتروني", value: "support@spanker.com", sub: "رد خلال 24 ساعة" },
];

const OFFICES = [
  {
    city: "القاهرة — المقر الرئيسي",
    address: "مطار القاهرة الدولي، مبنى 1، الطابق الثالث",
    phone: "+20 2 2265 4300",
    email: "cairo@spanker.com",
    hours: "السبت–الخميس: 9 ص – 5 م",
    flag: "🇪🇬",
  },
  {
    city: "الغردقة",
    address: "مطار الغردقة الدولي، صالة المغادرة",
    phone: "+20 65 344 2200",
    email: "hurghada@spanker.com",
    hours: "يومياً: 7 ص – 8 م",
    flag: "🇪🇬",
  },
  {
    city: "شرم الشيخ",
    address: "مطار شرم الشيخ الدولي، مكتب الشركات",
    phone: "+20 69 360 1500",
    email: "sharm@spanker.com",
    hours: "يومياً: 7 ص – 8 م",
    flag: "🇪🇬",
  },
  {
    city: "الأقصر",
    address: "مطار الأقصر الدولي، ردهة الوصول",
    phone: "+20 95 274 5500",
    email: "luxor@spanker.com",
    hours: "السبت–الخميس: 8 ص – 4 م",
    flag: "🇪🇬",
  },
  {
    city: "مرسى علم",
    address: "مطار مرسى علم الدولي",
    phone: "+20 65 370 1200",
    email: "marsamatrouh@spanker.com",
    hours: "يومياً: 8 ص – 6 م",
    flag: "🇪🇬",
  },
  {
    city: "دبي",
    address: "مطار دبي الدولي، مبنى 2، مكتب رقم 312",
    phone: "+971 4 224 5500",
    email: "dubai@spanker.com",
    hours: "الأحد–الخميس: 9 ص – 6 م",
    flag: "🇦🇪",
  },
];

export default function OfficeContactsPage() {
  return (
    <PageShell
      pageId="office-contacts"
      section="سبانكر"
      title="مكاتب التواصل"
      subtitle="نحن هنا لمساعدتك في أي وقت"
      maxWidth="xl"
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "عن الشركة" },
        { label: "مكاتب التواصل" },
      ]}
    >
      {/* Quick contact cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {QUICK_CONTACTS.map((c) => (
          <div key={c.label} className="bg-bg-alt rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="text-xs text-text-muted mb-1">{c.label}</p>
            <p className="font-bold text-text-primary text-sm">{c.value}</p>
            <p className="text-xs text-brand-red mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Offices grid */}
      <h2 className="text-lg font-bold text-text-primary mb-5">مكاتبنا</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICES.map((office) => (
          <div
            key={office.city}
            className="border border-border-light rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{office.flag}</span>
              <h3 className="font-semibold text-text-primary text-sm">{office.city}</h3>
            </div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <p className="flex gap-1.5">
                <span className="shrink-0">📍</span>
                <span>{office.address}</span>
              </p>
              <p className="flex gap-1.5">
                <span>📞</span>
                <a
                  href={`tel:${office.phone.replace(/\s/g, "")}`}
                  className="hover:text-brand-red transition-colors"
                >
                  {office.phone}
                </a>
              </p>
              <p className="flex gap-1.5">
                <span>📧</span>
                <a
                  href={`mailto:${office.email}`}
                  className="hover:text-brand-red transition-colors"
                >
                  {office.email}
                </a>
              </p>
              <p className="flex gap-1.5">
                <span>🕐</span>
                <span>{office.hours}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency note */}
      <div className="mt-8 bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-5">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">ملاحظة:</span> في حالات الطوارئ أو
          إلغاء الرحلات، تواصل مباشرةً عبر خط العملاء{" "}
          <strong className="text-text-primary">19970</strong> المتاح على مدار الساعة.
        </p>
      </div>
    </PageShell>
  );
}
