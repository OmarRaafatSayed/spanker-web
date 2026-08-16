"use client";

/**
 * /admin/settings
 * Agency info, CRM integration status, supported countries,
 * staff management, notification preferences.
 * ENV vars are read-only — must be changed in Vercel config.
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string; user_id: string; full_name: string; phone: string; role: string; created_at: string;
}
interface VisaCountry { code: string; name: string; count: number; }
interface CrmStatus { reachable: boolean; latency_ms: number | null; version: string | null; error?: string; }

function getToken() {
  try {
    const raw = localStorage.getItem("customer_portal_session");
    if (!raw) return "";
    return (JSON.parse(raw) as { session?: { access_token?: string } })?.session?.access_token ?? "";
  } catch { return ""; }
}
async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts?.headers ?? {}) },
  });
  return res.json();
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
      <div className="px-5 py-4 border-b border-border-light flex items-center gap-2">
        <span className="text-brand-green">{icon}</span>
        <h2 className="font-bold text-text-primary text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Read-only env field ──────────────────────────────────────────────────────
function EnvField({ label, value, masked }: { label: string; value: string; masked?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>
      <div className="flex items-center gap-2 h-10 px-3 border border-border-light rounded-lg bg-bg-alt text-sm text-text-muted">
        <span className="flex-1 truncate font-mono text-xs">{masked ? value.replace(/./g, "•") : value}</span>
        <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-semibold shrink-0">Read-only</span>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [staff, setStaff]             = useState<StaffMember[]>([]);
  const [countries, setCountries]     = useState<VisaCountry[]>([]);
  const [crmStatus, setCrmStatus]     = useState<CrmStatus | null>(null);
  const [crmLoading, setCrmLoading]   = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);

  // Notifications prefs (local UI state)
  const [notifPrefs, setNotifPrefs] = useState({
    new_lead: true, doc_uploaded: true, status_changed: true,
    payment_received: true, crm_error: true,
  });

  const loadStaff = useCallback(async () => {
    setStaffLoading(true);
    const res = await apiFetch("/api/admin/customers");
    if (res.success || res.customers) {
      const all = (res.customers ?? res.data ?? []) as StaffMember[];
      setStaff(all.filter((c: StaffMember) => c.role === "staff" || c.role === "admin"));
    }
    setStaffLoading(false);
  }, []);

  const loadCountries = useCallback(async () => {
    const res = await apiFetch("/api/admin/visa-types");
    if (res.success) {
      const map = new Map<string, { name: string; count: number }>();
      for (const v of res.data ?? []) {
        const existing = map.get(v.country_code) ?? { name: v.country_name, count: 0 };
        existing.count++;
        map.set(v.country_code, existing);
      }
      setCountries([...map.entries()].map(([code, { name, count }]) => ({ code, name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  useEffect(() => {
    loadStaff();
    loadCountries();
  }, [loadStaff, loadCountries]);

  async function pingCrm() {
    setCrmLoading(true);
    const res = await apiFetch("/api/admin/crm/status");
    if (res.success) setCrmStatus(res.data);
    setCrmLoading(false);
  }

  const iCls = "w-full h-10 px-3 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-white";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary">الإعدادات</h1>
        <p className="text-sm text-text-muted mt-0.5">إعدادات النظام والوكالة</p>
      </div>

      {/* ── Agency Info ── */}
      <Section title="معلومات الوكالة" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-text-secondary mb-1">اسم الوكالة</label>
            <input defaultValue="آثار للسياحة والسفر" className={iCls} readOnly />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">البريد الإلكتروني</label>
            <input type="email" placeholder="info@athar-travel.com" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">رقم الهاتف</label>
            <input type="tel" placeholder="+20 1000000000" className={iCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">رقم واتساب</label>
            <input type="tel" placeholder="+20 1000000000" className={iCls} />
          </div>
        </div>
        <p className="text-xs text-text-muted mt-4 bg-bg-alt rounded-lg px-3 py-2">
          ℹ️ هذه الحقول للعرض فقط في الوقت الحالي. حفظ البيانات سيتطلب endpoint مخصص.
        </p>
      </Section>

      {/* ── CRM Integration ── */}
      <Section title="تكامل CRM" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}>
        <div className="space-y-4">
          <EnvField
            label="BACKEND_INTERNAL_URL"
            value={process.env.NEXT_PUBLIC_SUPABASE_URL ? "https://crm.railway.app (من Vercel env)" : "غير محدد"}
          />
          <EnvField label="CRM_WEBHOOK_SECRET" value="sk_live_xxxxxxxxxxxx" masked />

          {/* Webhook URL display */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Webhook URL (للإعداد في CRM)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 px-3 border border-border-light rounded-lg bg-bg-alt text-xs font-mono text-text-muted flex items-center truncate" dir="ltr">
                {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/crm` : "/api/webhooks/crm"}
              </div>
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/crm`).catch(() => {});
                  }
                }}
                className="h-10 px-3 border border-border-light rounded-lg text-xs font-semibold text-text-secondary hover:bg-bg-alt transition"
              >
                نسخ
              </button>
            </div>
          </div>

          {/* Ping test */}
          <div className="flex items-center gap-3">
            <button onClick={pingCrm} disabled={crmLoading} className="h-9 px-4 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green-dark disabled:opacity-50 transition flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={crmLoading ? "animate-spin" : ""}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {crmLoading ? "جاري الاختبار…" : "اختبار الاتصال"}
            </button>
            {crmStatus && (
              <div className={cn("flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full",
                crmStatus.reachable ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", crmStatus.reachable ? "bg-green-500" : "bg-red-500")} />
                {crmStatus.reachable
                  ? `متصل · ${crmStatus.latency_ms}ms${crmStatus.version ? ` · v${crmStatus.version}` : ""}`
                  : `غير متصل${crmStatus.error ? ` · ${crmStatus.error}` : ""}`
                }
              </div>
            )}
          </div>
          <p className="text-xs text-text-muted bg-bg-alt rounded-lg px-3 py-2">
            ℹ️ لتغيير BACKEND_INTERNAL_URL أو CRM_WEBHOOK_SECRET، استخدم Vercel Environment Variables.
          </p>
        </div>
      </Section>

      {/* ── Supported Countries ── */}
      <Section title="الدول المدعومة للتأشيرات" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>
        {countries.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">لا توجد تأشيرات مضافة حتى الآن</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {countries.map(c => (
              <a key={c.code} href={`/admin/visas?country=${c.code}`}
                className="flex items-center justify-between bg-bg-alt rounded-xl px-3 py-2.5 hover:bg-gray-100 transition group">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-green">{c.code}</span>
                  <span className="text-xs text-text-secondary mr-2">{c.name}</span>
                </div>
                <span className="text-[10px] text-text-muted">{c.count} نوع</span>
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-text-muted mt-3">لإضافة أو إزالة دولة، أضف / احذف تأشيراتها من صفحة التأشيرات.</p>
      </Section>

      {/* ── Staff Management ── */}
      <Section title="إدارة الفريق" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}>
        {staffLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : staff.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">لا يوجد موظفون حتى الآن</p>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-bg-alt rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-sm font-bold">
                    {s.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{s.full_name}</p>
                    <p className="text-xs text-text-muted">{s.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                    s.role === "admin" ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {s.role === "admin" ? "مسؤول" : "موظف"}
                  </span>
                  <a href={`/admin/customers?search=${s.full_name}`} className="text-[11px] text-brand-green hover:underline">
                    تغيير الدور
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-text-muted mt-3 bg-bg-alt rounded-lg px-3 py-2">
          ℹ️ لإضافة موظف جديد أو تغيير دوره، افتح ملفه في صفحة العملاء واستخدم زر "تغيير الدور".
        </p>
      </Section>

      {/* ── Notification Preferences ── */}
      <Section title="تفضيلات الإشعارات" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}>
        <div className="space-y-3">
          {[
            { key: "new_lead",        label: "طلب سفر جديد"         },
            { key: "doc_uploaded",    label: "مستند جديد مرفوع"     },
            { key: "status_changed",  label: "تغيير حالة الطلب"     },
            { key: "payment_received",label: "دفعة مالية جديدة"     },
            { key: "crm_error",       label: "خطأ في مزامنة CRM"    },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm text-text-secondary">{label}</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={notifPrefs[key as keyof typeof notifPrefs]}
                  onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green" />
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-4 bg-bg-alt rounded-lg px-3 py-2">
          ℹ️ هذه الإعدادات محلية في المتصفح حتى يتم ربطها بقاعدة البيانات.
        </p>
      </Section>
    </div>
  );
}
